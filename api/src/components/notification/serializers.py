# serializers.py
from rest_framework import serializers
from .models import Notification
from ...user.baseUser.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'actor', 'verb', 'timestamp', 'unread', 'notification_type']