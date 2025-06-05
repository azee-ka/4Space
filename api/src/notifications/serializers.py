from rest_framework import serializers
from .models import Notification, DeviceToken
from ..user.serializers import EssentialUserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender = EssentialUserSerializer(read_only=True) 
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'is_read', 'action_url', 'created_at', 'sender']

    def update(self, instance, validated_data):
        # Update status if provided
        status = validated_data.get('status', None)
        if status:
            instance.status = status
        
        # Mark as read if provided
        is_read = validated_data.get('is_read', None)
        if is_read is not None:
            instance.is_read = is_read
        
        instance.save()
        return instance
    
    
    
class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ['id','token','platform','created_at']
        read_only_fields = ['id','created_at']

    def create(self, validated_data):
        # ensure no duplicates for this user
        token = validated_data['token']
        user = self.context['request'].user
        obj, _ = DeviceToken.objects.get_or_create(user=user, token=token, defaults={'platform': validated_data['platform']})
        return obj