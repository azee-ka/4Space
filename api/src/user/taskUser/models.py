from django.db import models
from ..baseUser.models import BaseUser

class TaskUser(BaseUser):
    sort_option = models.CharField(max_length=20, default='created_at')
    is_grid_view = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Task User'
        verbose_name_plural = 'Task Users'

    def __str__(self):
        return self.username
