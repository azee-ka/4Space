from django.db import models

class TaskFlowUser(models.Model):
    user = models.OneToOneField('baseUser.BaseUser', on_delete=models.CASCADE, primary_key=True)
    sort_option = models.CharField(max_length=20, default='created_at')
    is_grid_view = models.BooleanField(default=True)
