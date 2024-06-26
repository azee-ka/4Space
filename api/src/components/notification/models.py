from django.db import models
from django.contrib.auth.models import User
from ...user.baseUser.models import BaseUser

class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('action', 'Action Required'),
    ]
    
    recipient = models.ForeignKey(BaseUser, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    verb = models.CharField(max_length=255)
    unread = models.BooleanField(default=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')

    def __str__(self):
        return f'{self.actor} {self.verb} to {self.recipient}'