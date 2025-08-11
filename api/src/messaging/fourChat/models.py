# anonchat/models.py
import uuid
from django.db import models
from django.utils import timezone


class ChatSession(models.Model):
    """
    Anonymous A<->B session. PIDs are ephemeral per connection.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    a_pid = models.CharField(max_length=32, db_index=True)
    b_pid = models.CharField(max_length=32, db_index=True)
    a_meta = models.JSONField(default=dict, blank=True)
    b_meta = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.pk} ({self.a_pid[:4]}… <-> {self.b_pid[:4]}…)"


class Message(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    sender_pid = models.CharField(max_length=32)
    text = models.TextField()
    ts = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["ts"]


class PingEvent(models.Model):
    """
    Optional analytics for 'ping' button presses (local-ticket only).
    """
    from_pid = models.CharField(max_length=32)
    to_pid = models.CharField(max_length=32, null=True, blank=True)
    ticket = models.CharField(max_length=64)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["from_pid"]),
            models.Index(fields=["ticket"]),
        ]


class Report(models.Model):
    """
    Simple abuse report endpoint (optional).
    """
    session = models.ForeignKey(ChatSession, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.CharField(max_length=200)
    details = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)