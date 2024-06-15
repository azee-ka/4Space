# serializers.py
from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.ReadOnlyField(source='actor.username')
    recipient_username = serializers.ReadOnlyField(source='recipient.username')
    
    class Meta:
        model = Notification
        fields = ['recipient_username', 'actor_username', 'verb', 'timestamp', 'unread']
