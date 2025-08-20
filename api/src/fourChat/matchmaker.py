import asyncio
import uuid
from typing import Dict, Tuple, List, Any

from channels.layers import get_channel_layer
from django.utils import timezone
from django.db import transaction

from .models import ChatSession


class _Matcher:
    """
    Simple in-memory matcher with wait-based relaxing.
    NOTE: In production with multiple workers, move this to Redis or a DB table.

    Interests are OPTIONAL:
    - We only require an overlap when BOTH sides provided non-empty interests
      AND BOTH are still within their own interest-wait windows.
    - If either side has no interests, or either side has waited past their
      interestWaitSec, interests do not block a match.
    """
    def __init__(self):
        self._lock = asyncio.Lock()
        self._waiting: Dict[str, Dict[str, Any]] = {}  # channel_name -> criteria
        self._tick = None  # background ticker task

    async def enqueue(self, channel_name: str, criteria: Dict[str, Any]):
        async with self._lock:
            self._waiting[channel_name] = criteria

    async def leave_queue(self, channel_name: str):
        async with self._lock:
            self._waiting.pop(channel_name, None)

    async def try_pair(self):
        await self._pairing_pass()
        await self._ensure_ticker()

    async def _ensure_ticker(self):
        if self._tick is None or self._tick.done():
            self._tick = asyncio.create_task(self._ticker())

    async def _ticker(self):
        try:
            while True:
                async with self._lock:
                    if not self._waiting:
                        break
                await self._pairing_pass()
                await asyncio.sleep(1.0)
        finally:
            self._tick = None

    async def _pairing_pass(self):
        async with self._lock:
            channels = list(self._waiting.keys())
            used = set()
            pairs: List[Tuple[str, str]] = []

            for i, c1 in enumerate(channels):
                if c1 in used:
                    continue
                for c2 in channels[i + 1:]:
                    if c2 in used:
                        continue
                    a = self._waiting.get(c1)
                    b = self._waiting.get(c2)
                    if not a or not b:
                        continue
                    if self._compatible(a, b):
                        pairs.append((c1, c2))
                        used.add(c1)
                        used.add(c2)
                        break

            for c1, c2 in pairs:
                a = self._waiting.pop(c1, None)
                b = self._waiting.pop(c2, None)
                if not a or not b:
                    continue
                await self._start_session(a, b)

    def _compatible(self, a: Dict[str, Any], b: Dict[str, Any]) -> bool:
        now_ts = timezone.now().timestamp()

        def waited_secs(x):
            return max(0, now_ts - float(x.get("joinedAt", now_ts)))

        # gender compatibility (both sides must accept each other)
        ag = (a.get("self") or {}).get("gender") or "other"
        bg = (b.get("self") or {}).get("gender") or "other"
        as_ = (a.get("seeking") or {}).get("gender") or "any"
        bs_ = (b.get("seeking") or {}).get("gender") or "any"
        if not _seek_ok(as_, bg) or not _seek_ok(bs_, ag):
            return False

        # interests intersection — OPTIONAL
        # Only enforce overlap when BOTH sides provided interests AND BOTH are still
        # within their own interest-wait windows. Otherwise, do not block on interests.
        a_int = set(a.get("interests") or [])
        b_int = set(b.get("interests") or [])
        a_wait_int = int((a.get("waits") or {}).get("interestSec", 15))
        b_wait_int = int((b.get("waits") or {}).get("interestSec", 15))
        a_still_needs_overlap = bool(a_int) and waited_secs(a) < a_wait_int
        b_still_needs_overlap = bool(b_int) and waited_secs(b) < b_wait_int

        if a_still_needs_overlap and b_still_needs_overlap:
            if a_int.isdisjoint(b_int):
                return False

        # countries with mode + relax after countryWaitSec when mode=prefer
        def country_pass(side, other):
            mode = (side.get("countryMode") or "prefer").lower()
            s = set(side.get("countries") or [])
            o = set(other.get("countries") or [])
            if not s:
                return True
            inter = s.intersection(o) if o else s
            if mode == "any":
                return True
            if mode == "strict":
                return len(inter) > 0
            if len(inter) > 0:
                return True
            waited = timezone.now().timestamp() - float(side.get("joinedAt"))
            return waited >= int((side.get("waits") or {}).get("countrySec", 20))

        if not country_pass(a, b) or not country_pass(b, a):
            return False

        # overall timeout window – if either waited too long, allow anyway
        max_a = int((a.get("waits") or {}).get("maxOverallSec", 60))
        max_b = int((b.get("waits") or {}).get("maxOverallSec", 60))
        if waited_secs(a) >= max_a or waited_secs(b) >= max_b:
            return True

        # general wait – small delay before pairing "anyone"
        gen_a = int((a.get("waits") or {}).get("generalSec", 3))
        gen_b = int((b.get("waits") or {}).get("generalSec", 3))
        if waited_secs(a) < gen_a or waited_secs(b) < gen_b:
            return False

        return True

    async def _start_session(self, a: Dict[str, Any], b: Dict[str, Any]):
        group = f"chat_{uuid.uuid4().hex}"
        session_id = None

        try:
            session_id = await _create_session(a, b)
        except Exception:
            session_id = uuid.uuid4().hex

        layer = get_channel_layer()
        payload_a = {
            "type": "chat.start",
            "group": group,
            "session_id": session_id,
            "self_pid": a["pid"],
            "peer_pid": b["pid"],
        }
        payload_b = {
            "type": "chat.start",
            "group": group,
            "session_id": session_id,
            "self_pid": b["pid"],
            "peer_pid": a["pid"],
        }

        await layer.send(a["channel"], payload_a)
        await layer.send(b["channel"], payload_b)


matcher = _Matcher()


def _seek_ok(seeking: str, partner_gender: str) -> bool:
    s = (seeking or "any").lower()
    if s == "any":
        return True
    return s == (partner_gender or "").lower()


# --- DB helpers (sync wrapped) ---
from channels.db import database_sync_to_async


@database_sync_to_async
def _create_session(a: Dict[str, Any], b: Dict[str, Any]) -> str:
    with transaction.atomic():
        sess = ChatSession.objects.create(
            a_pid=a["pid"],
            b_pid=b["pid"],
            a_meta={
                "age": a.get("self", {}).get("age"),
                "gender": a.get("self", {}).get("gender"),
                "countryCode": a.get("self", {}).get("countryCode"),
                "seeking": a.get("seeking", {}).get("gender"),
                "countries": a.get("countries", []),
                "interests": a.get("interests", []),
                "allowPings": a.get("allowPings", False),
            },
            b_meta={
                "age": b.get("self", {}).get("age"),
                "gender": b.get("self", {}).get("gender"),
                "countryCode": b.get("self", {}).get("countryCode"),
                "seeking": b.get("seeking", {}).get("gender"),
                "countries": b.get("countries", []),
                "interests": b.get("interests", []),
                "allowPings": b.get("allowPings", False),
            },
        )
        return str(sess.pk)