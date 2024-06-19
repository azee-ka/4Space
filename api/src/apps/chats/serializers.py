# serializers.py

from rest_framework import serializers
from .models import Chat, Message
from ...user.baseUser.models import BaseUser
from ...user.baseUser.serializers import BaseUserSerializer
from django.shortcuts import get_object_or_404

class MessageBaseUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['id', 'username', 'profile_picture', 'first_name', 'last_name']

class MessageSerializer(serializers.ModelSerializer):
    sender = MessageBaseUserSerializer()

    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'content', 'timestamp']



class ChatSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    messages = MessageSerializer(many=True, read_only=True)
    uuid = serializers.UUIDField()

    class Meta:
        model = Chat
        fields = ['id', 'uuid', 'participants', 'created_at', 'messages']

    def get_participants(self, obj):
        participants = obj.participants.all()
        return MessageBaseUserSerializer(participants, many=True).data



class UserChatSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    uuid = serializers.UUIDField()
    inviter = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'uuid', 'restricted', 'participants', 'inviter']

    def get_participants(self, obj):
        user = self.context['request'].user
        participants = obj.participants.exclude(id=user.id)  # Exclude the requesting user
        return MessageBaseUserSerializer(participants, many=True).data
    
    def get_inviter(self, obj):
        first_message = obj.messages.order_by('timestamp').first()
        if first_message:
            inviter = first_message.sender
            return MessageBaseUserSerializer(inviter).data
        return None
    
    
    
class RestrictedChatSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    messages = MessageSerializer(many=True, read_only=True)
    uuid = serializers.UUIDField()

    class Meta:
        model = Chat
        fields = ['id', 'uuid', 'participants', 'created_at', 'messages']

    def get_participants(self, obj):
        participants = obj.participants.all()
        return MessageBaseUserSerializer(participants, many=True).data