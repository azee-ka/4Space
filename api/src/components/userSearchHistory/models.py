# models.py
from django.db import models
from ...user.timelineUser.models import TimelineUser

class SearchHistory(models.Model):
    user = models.ForeignKey(TimelineUser, on_delete=models.CASCADE)
    searched_user = models.ForeignKey(TimelineUser, on_delete=models.CASCADE, related_name='searched_history')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} searched for {self.searched_user.username}"
