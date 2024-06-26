# models.py
from django.db import models
from django.conf import settings
from ...user.taskUser.models import TaskUser

class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    started = models.BooleanField(default=False)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(TaskUser, on_delete=models.CASCADE)

    def __str__(self):
        return self.title
