from rest_framework import serializers
from .models import InteractUser
from ..baseUser.models import BaseUser
from ..baseUser.serializers import UserSerializer, BaseUserSerializer

from ..timelineUser.models import TimelineUser
from ..taskflowUser.models import TaskFlowUser

class BaseInteractUserSerializer(serializers.ModelSerializer):
    user = BaseUserSerializer()  # Serialize BaseUser fields

    class Meta(BaseUserSerializer.Meta):
        model = InteractUser
        fields = ['user']
        
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_instance, created = BaseUser.objects.get_or_create(**user_data)

        # Create or get TimelineUser
        timeline_user, created = TimelineUser.objects.get_or_create(user=user_instance)

        # Create or get TaskFlowUser
        taskflow_user, created = TaskFlowUser.objects.get_or_create(user=user_instance)

        # Create InteractUser with all related instances
        interact_user = InteractUser.objects.create(
            user=user_instance,
            timeline_user=timeline_user,
            taskflow_user=taskflow_user
        )
        return interact_user
        
        
# class InteractUserSerializer(serializers.ModelSerializer):
#     user = UserSerializer(source='*')
#     timeline_profile = TimelineUserSerializer()
#     task_manager_profile = TaskFlowUserSerializer()

#     class Meta:
#         model = InteractUser
#         fields = ['user', 'timeline_profile', 'task_manager_profile']
