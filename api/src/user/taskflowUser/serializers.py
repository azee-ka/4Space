from rest_framework import serializers
from .models import TaskFlowUser

class TaskFlowUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskFlowUser
        fields = ['sort_option', 'is_grid_view']
