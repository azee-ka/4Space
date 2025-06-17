from django.db import models
from django.conf import settings

class UserSetting(models.Model):
    CATEGORY_CHOICES = [
        ('display', 'Display'),
        # ('editor', 'Editor'),
        # ('notifications', 'Notifications'),
        # Add more categories as needed
    ]

    user = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE, related_name='settings')
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
    key = models.CharField(max_length=64)
    value = models.JSONField()

    class Meta:
        unique_together = ('user', 'category', 'key')

    def __str__(self):
        return f"{self.user.username} - {self.category}.{self.key}"
