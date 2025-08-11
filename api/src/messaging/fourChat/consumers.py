# messaging/config/consumers/4chat_consumers.py
import asyncio
import json
import uuid
from typing import Any, Dict, Optional

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from django.contrib.auth import get_user_model
from django.apps import apps
from asgiref.sync import sync_to_async

import urllib.parse
import hmac
import hashlib

from .matchmaker import matcher
from .models import ChatSession, Message, PingEvent



def _rand_pid() -> str:
    # short, url-safe-ish
    return uuid.uuid4().hex[:10]


# Deterministic reconnect token derived from session_id + SECRET_KEY
def _make_rtoken(session_id: str) -> str:
    """
    Deterministic reconnect token derived from session_id + SECRET_KEY.
    Safe to expose to clients; not reversible and stable across workers.
    """
    dig = hmac.new(
        key=str(settings.SECRET_KEY).encode("utf-8"),
        msg=str(session_id).encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()[:32]
    return f"rt_{dig}"


# ---- Presence & mapping (Redis-cache + channel layer groups) ----
REG_LOCK = asyncio.Lock()

G_PREFIX = "g4"  # channel layer group prefix
P_PREFIX = "4chat:presence"  # cache key prefix for presence sets
PID_UID_PREFIX = "4chat:pid_uid:"

def _g(kind: str, key: str) -> str:
    return f"{G_PREFIX}:{kind}:{key}"

def _pk(kind: str, key: str) -> str:
    return f"{P_PREFIX}:{kind}:{key}"

# Cache helpers (sync) — we wrap with sync_to_async at call sites
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


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    Speaks the wire protocol your React client uses:

    -> client:
        {type:"join", interests:[], allowPings:bool, countries:[], countryMode:"strict|prefer|any",
         waits:{generalSec, interestSec, countrySec, maxOverallSec},
         self:{age, gender}, seeking:{gender}}
        {type:"message", text}
        {type:"typing", isTyping}
        {type:"next"}
        {type:"ping", ticket}   # we ack with 'pong' for now

    <- server:
        {type:"paired", partner:{flair, pid}, pid}   # pid = your pid; partner.pid = peer pid
        {type:"message", text}
        {type:"typing", isTyping}
        {type:"system", text}
        {type:"left"}
        {type:"pong"}
    """

    # ------- lifecycle -------
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

        # Map pid -> uid in shared cache
        await sync_to_async(_map_pid_uid)(self.pid, self.uid)

        # Join global presence groups (multi-worker safe)
        await self.channel_layer.group_add(_g("pid", self.pid), self.channel_name)
        await sync_to_async(_presence_add)("pid", self.pid, self.channel_name)
        if self.uid:
            await self.channel_layer.group_add(_g("uid", self.uid), self.channel_name)
            await sync_to_async(_presence_add)("uid", self.uid, self.channel_name)

        await self.send_json({"type": "system", "text": "Connected to 4Chat."})

    async def disconnect(self, close_code):
        # Detach presence/groups
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
        # Detach all rtoken groups we joined
        for rt in list(getattr(self, "rtokens", [])):
            try:
                await self.channel_layer.group_discard(_g("rt", rt), self.channel_name)
                await sync_to_async(_presence_remove)("rt", rt, self.channel_name)
            except Exception:
                pass

        # clear mapping
        try:
            await sync_to_async(_del_pid_uid)(self.pid)
        except Exception:
            pass

        # If in queue, remove; if in session, notify partner and close session
        try:
            await matcher.leave_queue(self.channel_name)
        except Exception:
            pass
        if self.group_name:
            await self._notify_left_and_cleanup()

    # ------- incoming messages -------
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
            await self._group_send(
                {
                    "type": "chat.message",
                    "sender_pid": self.pid,
                    "text": text,
                }
            )
            await self._save_message(text)

        elif msg_type == "typing":
            if not self.group_name:
                return
            is_typing = bool(content.get("isTyping"))
            await self._group_send(
                {
                    "type": "chat.typing",
                    "sender_pid": self.pid,
                    "isTyping": is_typing,
                }
            )

        elif msg_type == "next":
            # leave current session, re-enqueue with last known criteria
            await self._notify_left_and_cleanup()
            if self.wait_record:
                await matcher.enqueue(self.channel_name, self.wait_record)
                # try to immediately pair (fast path)
                await matcher.try_pair()

        elif msg_type == "ping":
            # Extended ping: target by rtoken (anonymous history), toUid (logged-in), or toPid.
            rtoken = str(content.get("rtoken") or "")
            to_uid = content.get("toUid")
            to_pid = content.get("toPid")
            ticket = str(content.get("ticket") or "")  # legacy analytics

            # Collect target channels from presence (cross-worker)
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

            # Exclude self
            if self.channel_name in target_channels:
                target_channels.discard(self.channel_name)

            delivered = 0
            for ch in list(target_channels):
                await self.channel_layer.send(
                    ch,
                    {
                        "type": "ping.notify",
                        "payload": {
                            "from": {"pid": self.pid, "uid": getattr(self, "uid", None)},
                            "rtoken": rtoken or None,
                        },
                    },
                )
                delivered += 1

            if ticket:
                await self._save_ping(ticket)

            # If nobody online and we have a user target, create offline notification + push
            offline_notified = False
            if delivered == 0 and to_uid:
                try:
                    notif_id = await self._notify_offline(str(to_uid), rtoken)
                    offline_notified = bool(notif_id)
                except Exception:
                    offline_notified = False

            await self.send_json({"type": "pong", "delivered": delivered, "offlineNotified": offline_notified})

    # ------- join / pairing -------
    async def _handle_join(self, payload: Dict[str, Any]):
        # Normalize incoming meta used for matching
        interests = [str(t).strip().lower() for t in (payload.get("interests") or []) if str(t).strip()]
        countries = [str(c).strip() for c in (payload.get("countries") or []) if str(c).strip()]

        waits = payload.get("waits") or {}
        general_wait = int(waits.get("generalSec") or 3)
        interest_wait = int(waits.get("interestSec") or 15)
        country_wait = int(waits.get("countrySec") or 20)
        max_overall = int(waits.get("maxOverallSec") or 60)

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
                "age": _safe_int(payload.get("self", {}).get("age")),
                "gender": _safe_str(payload.get("self", {}).get("gender"), "other"),
            },
            "seeking": {
                "gender": _safe_str(payload.get("seeking", {}).get("gender"), "any"),
            },
            "interests": interests,
            "joinedAt": timezone.now().timestamp(),
            "pid": self.pid,
            "channel": self.channel_name,
        }

        # store for "next"
        self.wait_record = self.meta

        # Place in queue and try pairing
        await matcher.enqueue(self.channel_name, self.meta)
        await matcher.try_pair()

        # Let the client see a status line (optional)
        await self.send_json({"type": "system", "text": "Searching for a match…"})

    # ------- session events from other side / group -------
    async def chat_start(self, event: Dict[str, Any]):
        """
        Called by matchmaker when a session is formed. Payload:
          {"type":"chat.start", "group": str, "session_id": str,
           "self_pid": str, "peer_pid": str}
        """
        self.group_name = event["group"]
        self.session_id = event["session_id"]
        peer_pid = event["peer_pid"]

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # compute + register reconnect token for "season history" pings
        rtoken = _make_rtoken(self.session_id)
        self.rtokens.add(rtoken)
        await self.channel_layer.group_add(_g("rt", rtoken), self.channel_name)
        await sync_to_async(_presence_add)("rt", rtoken, self.channel_name)

        # find peer's uid from pid→uid map (cached)
        peer_uid = await sync_to_async(_get_uid_for_pid_sync)(peer_pid)

        # tell UI it’s paired
        await self.send_json(
            {
                "type": "paired",
                "partner": {"flair": "Stranger", "pid": peer_pid, "uid": peer_uid},
                "pid": self.pid,
                "rtoken": rtoken,
            }
        )
        await self.send_json({"type": "system", "text": "Connected. Say hi!"})

    async def chat_message(self, event: Dict[str, Any]):
        # only deliver to the other side
        if event.get("sender_pid") == self.pid:
            return
        await self.send_json({"type": "message", "text": event.get("text", "")})

    async def chat_typing(self, event: Dict[str, Any]):
        if event.get("sender_pid") == self.pid:
            return
        await self.send_json({"type": "typing", "isTyping": bool(event.get("isTyping"))})

    async def chat_left(self, event: Dict[str, Any]):
        # peer left the session
        await self.send_json({"type": "left"})
        await self.send_json({"type": "system", "text": "Stranger disconnected."})

    async def ping_notify(self, event: Dict[str, Any]):
        payload = event.get("payload", {})
        await self.send_json({"type": "ping", **payload})

    # ------- helpers -------
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
                # fire-and-forget push sending (stub)
                title = "4Chat ping"
                body = "Open the app to reconnect."
                extra = {"rtoken": rtoken} if rtoken else {}
                for token, platform in tokens:
                    await self._send_push_via_provider(platform, token, title, body, extra)
        except Exception:
            pass
        return notif_id

    async def _send_push_via_provider(self, platform: str, token: str, title: str, body: str, extra: Dict[str, Any]):
        """
        Stub: integrate with FCM/APNs here. Left as a no-op to avoid blocking.
        """
        return

    async def _group_send(self, payload: Dict[str, Any]):
        if not self.group_name:
            return
        await self.channel_layer.group_send(self.group_name, payload)

    async def _notify_left_and_cleanup(self):
        if not self.group_name:
            return
        # notify peer
        await self.channel_layer.group_send(self.group_name, {"type": "chat.left"})
        # leave group
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        # mark session closed
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