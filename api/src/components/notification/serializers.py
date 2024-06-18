# serializers.py
from rest_framework import serializers
from .models import Notification
from ...user.interactUser.serializers import SimplifiedUserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    actor = SimplifiedUserSerializer(read_only=True)
    recipient = SimplifiedUserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'actor', 'verb', 'timestamp', 'unread', 'notification_type']