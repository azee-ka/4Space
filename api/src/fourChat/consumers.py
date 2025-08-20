import asyncio
from typing import Any, Dict, Optional

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from django.contrib.auth import get_user_model
from django.apps import apps

import uuid
import urllib.parse
import hmac
import hashlib
import re

from .matchmaker import matcher
from .models import ChatSession, Message, PingEvent


# ------------------ helpers: ids & tokens ------------------

def _rand_pid() -> str:
    return uuid.uuid4().hex[:10]


def _make_rtoken(session_id: str) -> str:
    dig = hmac.new(
        key=str(settings.SECRET_KEY).encode("utf-8"),
        msg=str(session_id).encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()[:32]
    return f"rt_{dig}"


# ------------------ presence & groups (Redis cache + Channels groups) ------------------

G_PREFIX = "g4"
P_PREFIX = "4chat:presence"
PID_UID_PREFIX = "4chat:pid_uid:"
STATS_ONLINE_KEY = "4chat:stats:online"

# NEW: per-PID meta (gender / countryCode) cache
PID_META_PREFIX = "4chat:pid_meta:"  # value: {"gender": "male|female|other", "countryCode": "US"}

def _group_safe(name: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9\-_.]", "_", name)
    return safe[:96]

def _g(kind: str, key: str) -> str:
    return _group_safe(f"{G_PREFIX}.{kind}.{key}")

def _pk(kind: str, key: str) -> str:
    return f"{P_PREFIX}:{kind}:{key}"

def _presence_add(kind: str, key: str, ch: str, ttl: int = 3600):
    s = set(cache.get(_pk(kind, key), []))
    s.add(ch)
    cache.set(_pk(kind, key), list(s), timeout=ttl)

def _presence_remove(kind: str, key: str, ch: str, ttl: int = 3600):
    s = set(cache.get(_pk(kind, key), []))
    if ch in s:
        s.discard(ch)
        if s:
            cache.set(_pk(kind, key), list(s), timeout=ttl)
        else:
            cache.delete(_pk(kind, key))

def _presence_list(kind: str, key: str):
    return list(cache.get(_pk(kind, key), []))

def _map_pid_uid(pid: str, uid: Optional[str], ttl: int = 3600):
    cache.set(f"{PID_UID_PREFIX}{pid}", uid, timeout=ttl)

def _get_uid_for_pid_sync(pid: str) -> Optional[str]:
    return cache.get(f"{PID_UID_PREFIX}{pid}")

def _del_pid_uid(pid: str):
    cache.delete(f"{PID_UID_PREFIX}{pid}")

def _online_change(delta: int) -> int:
    cache.add(STATS_ONLINE_KEY, 0, timeout=None)
    if delta > 0:
        try:
            cache.incr(STATS_ONLINE_KEY, delta)
        except Exception:
            cache.set(STATS_ONLINE_KEY, int(cache.get(STATS_ONLINE_KEY) or 0) + delta, timeout=None)
    else:
        try:
            cache.decr(STATS_ONLINE_KEY, -delta)
        except Exception:
            cache.set(STATS_ONLINE_KEY, max(0, int(cache.get(STATS_ONLINE_KEY) or 0) + delta), timeout=None)
    return int(cache.get(STATS_ONLINE_KEY) or 0)

def _online_get() -> int:
    return int(cache.get(STATS_ONLINE_KEY) or 0)


# ------------------ NEW: meta helpers ------------------

def _safe_gender(v: Any, default="other") -> str:
    s = str(v or "").strip().lower()
    if s.startswith("m"):
        return "male"
    if s.startswith("f"):
        return "female"
    if s in {"other", "any", "o", "x", "nb", "nonbinary", "non-binary"}:
        return "other"
    return default

_CC_RE = re.compile(r"^[A-Z]{2}$")

def _safe_cc(v: Any) -> Optional[str]:
    s = str(v or "").strip().upper()
    return s if _CC_RE.match(s) else None

def _set_pid_meta(pid: str, meta: Dict[str, Any], ttl: int = 3600):
    cache.set(f"{PID_META_PREFIX}{pid}", meta, timeout=ttl)

def _get_pid_meta(pid: str) -> Dict[str, Any]:
    return cache.get(f"{PID_META_PREFIX}{pid}") or {}

def _del_pid_meta(pid: str):
    cache.delete(f"{PID_META_PREFIX}{pid}")


# ------------------ consumer ------------------

class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    Wire protocol:

    -> client:
        {type:"join", interests:[], allowPings:bool, countries:[], countryMode:"strict|prefer|any",
         waits:{generalSec, interestSec, countrySec, maxOverallSec},
         self:{age, gender, countryCode?}, seeking:{gender}}
        {type:"message", text}
        {type:"typing", isTyping}
        {type:"meta", self:{gender?, countryCode?}}      # NEW
        {type:"next"}
        {type:"ping", rtoken?|toUid?|toPid?|ticket?}
        {type:"stats"}

    <- server:
        {type:"paired", partner:{flair, pid, uid?, gender?, countryCode?}, pid, rtoken}  # NEW fields
        {type:"message", text}
        {type:"typing", isTyping}
        {type:"meta", self:{gender?, countryCode?}}      # NEW (forwarded partner meta)
        {type:"system", text}
        {type:"left"}
        {type:"pong", delivered:int, offlineNotified?:bool}
        {type:"ping", from:{pid, uid?}, rtoken?}
        {type:"presence", online:int}
    """

    async def connect(self):
        await self.accept()
        self.pid = _rand_pid()
        user = self.scope.get("user")
        self.uid = str(getattr(user, "pk", "")) if getattr(user, "is_authenticated", False) else None

        self.meta: Dict[str, Any] = {}
        self.session_id: Optional[str] = None
        self.group_name: Optional[str] = None
        self.wait_record: Optional[Dict[str, Any]] = None
        self.rtokens = set()

        await sync_to_async(_map_pid_uid)(self.pid, self.uid)

        await self.channel_layer.group_add(_g("pid", self.pid), self.channel_name)
        await sync_to_async(_presence_add)("pid", self.pid, self.channel_name)
        if self.uid:
            await self.channel_layer.group_add(_g("uid", self.uid), self.channel_name)
            await sync_to_async(_presence_add)("uid", self.uid, self.channel_name)

        await self.channel_layer.group_add(_g("global", "all"), self.channel_name)
        count = await sync_to_async(_online_change)(+1)
        await self.channel_layer.group_send(_g("global", "all"), {"type": "stats.push", "online": count})

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(_g("pid", self.pid), self.channel_name)
            await sync_to_async(_presence_remove)("pid", self.pid, self.channel_name)
        except Exception:
            pass
        if getattr(self, "uid", None):
            try:
                await self.channel_layer.group_discard(_g("uid", self.uid), self.channel_name)
                await sync_to_async(_presence_remove)("uid", self.uid, self.channel_name)
            except Exception:
                pass

        for rt in list(self.rtokens):
            try:
                await self.channel_layer.group_discard(_g("rt", rt), self.channel_name)
                await sync_to_async(_presence_remove)("rt", rt, self.channel_name)
            except Exception:
                pass

        try:
            await sync_to_async(_del_pid_uid)(self.pid)
            await sync_to_async(_del_pid_meta)(self.pid)   # NEW
        except Exception:
            pass

        try:
            await matcher.leave_queue(self.channel_name)
        except Exception:
            pass
        if self.group_name:
            await self._notify_left_and_cleanup()

        try:
            await self.channel_layer.group_discard(_g("global", "all"), self.channel_name)
        except Exception:
            pass
        try:
            count = await sync_to_async(_online_change)(-1)
            await self.channel_layer.group_send(_g("global", "all"), {"type": "stats.push", "online": count})
        except Exception:
            pass

    async def receive_json(self, content: Dict[str, Any], **kwargs):
        msg_type = content.get("type")

        if msg_type == "join":
            await self._handle_join(content)

        elif msg_type == "message":
            if not self.group_name or not self.session_id:
                return
            text = (content.get("text") or "").strip()
            if not text:
                return
            await self._group_send({"type": "chat.message", "sender_pid": self.pid, "text": text})
            await self._save_message(text)

        elif msg_type == "typing":
            if not self.group_name:
                return
            is_typing = bool(content.get("isTyping"))
            await self._group_send({"type": "chat.typing", "sender_pid": self.pid, "isTyping": is_typing})

        # NEW: receive and forward meta updates (gender/country)
        elif msg_type == "meta":
            data = content.get("self") or content
            gender = _safe_gender((data or {}).get("gender"), default=None)
            cc = _safe_cc((data or {}).get("countryCode"))
            current = await sync_to_async(_get_pid_meta)(self.pid)
            new_meta = {**current}
            if gender:
                new_meta["gender"] = gender
            if cc:
                new_meta["countryCode"] = cc
            await sync_to_async(_set_pid_meta)(self.pid, new_meta)
            if self.group_name:
                await self._group_send({"type": "chat.meta", "sender_pid": self.pid, "self": new_meta})

        elif msg_type == "next":
            await self._notify_left_and_cleanup()
            if self.wait_record:
                await matcher.enqueue(self.channel_name, self.wait_record)
                await matcher.try_pair()

        elif msg_type == "ping":
            rtoken = str(content.get("rtoken") or "")
            to_uid = content.get("toUid")
            to_pid = content.get("toPid")
            ticket = str(content.get("ticket") or "")

            target_channels = set()
            if to_uid:
                chans = await sync_to_async(_presence_list)("uid", str(to_uid))
                target_channels.update(chans)
            if to_pid:
                chans = await sync_to_async(_presence_list)("pid", str(to_pid))
                target_channels.update(chans)
            if rtoken:
                chans = await sync_to_async(_presence_list)("rt", rtoken)
                target_channels.update(chans)

            target_channels.discard(self.channel_name)

            delivered = 0
            for ch in target_channels:
                await self.channel_layer.send(
                    ch,
                    {
                        "type": "ping.notify",
                        "payload": {"from": {"pid": self.pid, "uid": getattr(self, "uid", None)}, "rtoken": rtoken or None},
                    },
                )
                delivered += 1

            if ticket:
                await self._save_ping(ticket)

            offline_notified = False
            if delivered == 0 and to_uid:
                try:
                    notif_id = await self._notify_offline(str(to_uid), rtoken)
                    offline_notified = bool(notif_id)
                except Exception:
                    offline_notified = False

            await self.send_json({"type": "pong", "delivered": delivered, "offlineNotified": offline_notified})

        elif msg_type == "stats":
            count = await sync_to_async(_online_get)()
            await self.send_json({"type": "presence", "online": count})

    # ------------------ matchmaking ------------------

    async def _handle_join(self, payload: Dict[str, Any]):
        interests = [str(t).strip().lower() for t in (payload.get("interests") or []) if str(t).strip()]
        countries = [str(c).strip() for c in (payload.get("countries") or []) if str(c).strip()]
        waits = payload.get("waits") or {}
        general_wait = int(waits.get("generalSec") or 3)
        interest_wait = int(waits.get("interestSec") or 15)
        country_wait = int(waits.get("countrySec") or 20)
        max_overall = int(waits.get("maxOverallSec") or 60)

        # pull meta and store it immediately so the peer can see it at 'paired'
        raw_self = payload.get("self") or {}
        gender = _safe_gender(raw_self.get("gender"))
        cc = _safe_cc(raw_self.get("countryCode"))

        # keep a copy on the instance and in the cache
        self.meta = {
            "allowPings": bool(payload.get("allowPings")),
            "countries": countries,
            "countryMode": payload.get("countryMode") or "prefer",
            "waits": {
                "generalSec": general_wait,
                "interestSec": interest_wait,
                "countrySec": country_wait,
                "maxOverallSec": max_overall,
            },
            "self": {
                "age": _safe_int(raw_self.get("age")),
                "gender": gender,
                "countryCode": cc,
            },
            "seeking": {"gender": _safe_str((payload.get("seeking") or {}).get("gender"), "any")},
            "interests": interests,
            "joinedAt": timezone.now().timestamp(),
            "pid": self.pid,
            "channel": self.channel_name,
        }
        await sync_to_async(_set_pid_meta)(self.pid, {"gender": gender, "countryCode": cc})
        self.wait_record = self.meta  # remember for "next"

        await matcher.enqueue(self.channel_name, self.meta)
        await matcher.try_pair()

    # ------------------ group event handlers ------------------

    async def chat_start(self, event: Dict[str, Any]):
        """
        {"type":"chat.start","group": str,"session_id": str,"self_pid": str,"peer_pid": str}
        """
        self.group_name = event["group"]
        self.session_id = event["session_id"]
        peer_pid = event["peer_pid"]

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # join reconnect token group for history pings
        rtoken = _make_rtoken(self.session_id)
        self.rtokens.add(rtoken)
        await self.channel_layer.group_add(_g("rt", rtoken), self.channel_name)
        await sync_to_async(_presence_add)("rt", rtoken, self.channel_name)

        peer_uid = await sync_to_async(_get_uid_for_pid_sync)(peer_pid)
        peer_meta = await sync_to_async(_get_pid_meta)(peer_pid)  # NEW

        await self.send_json(
            {
                "type": "paired",
                "partner": {
                    "flair": "Stranger",
                    "pid": peer_pid,
                    "uid": peer_uid,
                    **({k: v for k, v in peer_meta.items() if v} or {}),
                },
                "pid": self.pid,
                "rtoken": rtoken,
            }
        )
        await self.send_json({"type": "system", "text": "Connected. Say hi!"})

        # Proactively push *our* current meta to the peer as well
        my_meta = await sync_to_async(_get_pid_meta)(self.pid)
        if my_meta:
            await self._group_send({"type": "chat.meta", "sender_pid": self.pid, "self": my_meta})

    async def chat_message(self, event: Dict[str, Any]):
        if event.get("sender_pid") == self.pid:
            return
        await self.send_json({"type": "message", "text": event.get("text", "")})

    async def chat_typing(self, event: Dict[str, Any]):
        if event.get("sender_pid") == self.pid:
            return
        await self.send_json({"type": "typing", "isTyping": bool(event.get("isTyping"))})

    # NEW: forward meta to the other side
    async def chat_meta(self, event: Dict[str, Any]):
        if event.get("sender_pid") == self.pid:
            return
        meta = event.get("self") or {}
        await self.send_json({"type": "meta", "self": meta})

    async def chat_left(self, event: Dict[str, Any]):
        await self.send_json({"type": "left"})
        await self.send_json({"type": "system", "text": "Stranger disconnected."})

    async def ping_notify(self, event: Dict[str, Any]):
        payload = event.get("payload", {})
        await self.send_json({"type": "ping", **payload})

    async def stats_push(self, event):
        await self.send_json({"type": "presence", "online": int(event.get("online", 0))})

    # ------------------ helpers ------------------

    @database_sync_to_async
    def _create_notification(self, to_uid: str, rtoken: Optional[str]) -> Optional[int]:
        User = get_user_model()
        try:
            to_user = User.objects.get(pk=to_uid)
        except User.DoesNotExist:
            return None
        sender_user = None
        if getattr(self, "uid", None):
            try:
                sender_user = User.objects.get(pk=self.uid)
            except User.DoesNotExist:
                sender_user = None
        Notification = apps.get_model("notifications", "Notification")
        base = getattr(settings, "FRONTEND_URL", None) or getattr(settings, "SITE_URL", None) or ""
        qs = "?" + urllib.parse.urlencode({"rtoken": rtoken}) if rtoken else ""
        action_url = f"{base.rstrip('/')}/4chat{qs}" if base else None
        n = Notification.objects.create(
            user=to_user,
            sender=sender_user,
            title="Ping on 4Chat",
            message="A recent chat partner pinged you to reconnect.",
            type="action",
            action_url=action_url,
            is_critical=False,
        )
        return n.pk

    @database_sync_to_async
    def _get_device_tokens(self, to_uid: str):
        DeviceToken = apps.get_model("notifications", "DeviceToken")
        return list(DeviceToken.objects.filter(user_id=to_uid).values_list("token", "platform"))

    async def _notify_offline(self, to_uid: str, rtoken: Optional[str]) -> Optional[int]:
        notif_id = await self._create_notification(to_uid, rtoken)
        try:
            tokens = await self._get_device_tokens(to_uid)
            if tokens:
                title = "4Chat ping"
                body = "Open the app to reconnect."
                extra = {"rtoken": rtoken} if rtoken else {}
                for token, platform in tokens:
                    await self._send_push_via_provider(platform, token, title, body, extra)
        except Exception:
            pass
        return notif_id

    async def _send_push_via_provider(self, platform: str, token: str, title: str, body: str, extra: Dict[str, Any]):
        return

    async def _group_send(self, payload: Dict[str, Any]):
        if not self.group_name:
            return
        await self.channel_layer.group_send(self.group_name, payload)

    async def _notify_left_and_cleanup(self):
        if not self.group_name:
            return
        await self.channel_layer.group_send(self.group_name, {"type": "chat.left"})
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if self.session_id:
            await self._end_session()
        self.group_name = None
        self.session_id = None

    @database_sync_to_async
    def _save_message(self, text: str):
        if not self.session_id:
            return
        try:
            sess = ChatSession.objects.get(pk=self.session_id)
            Message.objects.create(session=sess, sender_pid=self.pid, text=text)
        except ChatSession.DoesNotExist:
            pass

    @database_sync_to_async
    def _end_session(self):
        try:
            ChatSession.objects.filter(pk=self.session_id, ended_at__isnull=True).update(
                ended_at=timezone.now()
            )
        except Exception:
            pass

    @database_sync_to_async
    def _save_ping(self, ticket: str):
        try:
            PingEvent.objects.create(from_pid=self.pid, to_pid=None, ticket=ticket)
        except Exception:
            pass


def _safe_int(v, default=None):
    try:
        return int(v)
    except Exception:
        return default


def _safe_str(v, default=""):
    s = (v or "").strip().lower()
    return s or default