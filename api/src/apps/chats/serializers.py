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

    class Meta:
        model = Chat
        fields = ['id', 'participants', 'created_at', 'messages']

    def get_participants(self, obj):
        participants = obj.participants.all()
        return MessageBaseUserSerializer(participants, many=True).data



class UserChatSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'other_user']

    def get_other_user(self, obj):
        user = self.context['request'].user
        participants = obj.participants.exclude(id=user.id)  # Exclude the requesting user
        if participants.exists():
            other_user = participants.first()
            return MessageBaseUserSerializer(other_user).data
        return None
    
    
    
class RestrictedChatSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'participants', 'created_at', 'messages']

    def get_participants(self, obj):
        participants = obj.participants.all()
        return MessageBaseUserSerializer(participants, many=True).data