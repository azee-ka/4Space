# models.py
import uuid
from django.db import models
from ...user.interactUser.models import InteractUser


class Chat(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(InteractUser, related_name='chats')
    created_at = models.DateTimeField(auto_now_add=True)
    restricted = models.BooleanField(default=True)

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(InteractUser, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
