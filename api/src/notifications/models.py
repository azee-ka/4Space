from django.db import models
from ..user.models import BaseUser

class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'Informational'),
        ('action', 'Actionable'),
        ('alert', 'Alert'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('disapproved', 'Disapproved'),
        ('completed', 'Completed'),  # For future extensibility
    ]

    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE, related_name="notifications")
    sender = models.ForeignKey(BaseUser, on_delete=models.CASCADE, related_name="sent_notifications", null=True, blank=True)  # Add sender
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(choices=TYPE_CHOICES, max_length=20, default='info')
    status = models.CharField(choices=STATUS_CHOICES, max_length=20, default='pending')  # New field
    action_url = models.URLField(blank=True, null=True)  # For actionable notifications
    is_read = models.BooleanField(default=False)
    is_critical = models.BooleanField(default=False)  # For prioritization
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} for {self.user.username}"
