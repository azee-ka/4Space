from django.db import models
from django.contrib.auth.models import User
from ...user.interactUser.models import InteractUser

class Notification(models.Model):
    recipient = models.ForeignKey(InteractUser, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(InteractUser, on_delete=models.CASCADE)
    verb = models.CharField(max_length=255)
    unread = models.BooleanField(default=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.actor} {self.verb} to {self.recipient}'