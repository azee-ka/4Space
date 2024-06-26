# interactUser/models.py
from django.db import models
from ..baseUser.models import BaseUser
from ..timelineUser.models import TimelineUser
from ..taskflowUser.models import TaskFlowUser

class InteractUser(models.Model):
    user = models.OneToOneField(BaseUser, on_delete=models.CASCADE, null=True)
    timeline_user = models.OneToOneField(TimelineUser, on_delete=models.CASCADE, null=True)
    taskflow_user = models.OneToOneField(TaskFlowUser, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.user.username