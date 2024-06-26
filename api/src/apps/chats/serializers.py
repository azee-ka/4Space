# serializers.py

from rest_framework import serializers
from .models import Chat, Message, ChatParticipant
from ...user.baseUser.models import BaseUser
from ...user.baseUser.serializers import BaseUserSerializer, IdealUserSerializer
from ...user.timelineUser.models import TimelineUser
from django.shortcuts import get_object_or_404

class MessageBaseUserSerializer(serializers.ModelSerializer):
    user = IdealUserSerializer(read_only=True)
    class Meta:
        model = TimelineUser
        fields = ['user'] 


class ChatParticipantSerializer(serializers.ModelSerializer):
    participant = MessageBaseUserSerializer()
    
    class Meta:
        model = ChatParticipant
        fields = ['id', 'chat', 'participant', 'restricted', 'is_inviter']

        
        
        
class MessageSerializer(serializers.ModelSerializer):
    sender = MessageBaseUserSerializer()

    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'content', 'timestamp']




class ChatSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    messages = MessageSerializer(many=True, read_only=True)
    uuid = serializers.UUIDField()
    inviter = serializers.SerializerMethodField()
    me = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'uuid', 'participants', 'created_at', 'messages', 'inviter', 'me']

    def get_participants(self, obj):
        user = self.context['request'].user.interactuser.timeline_user
        participants = obj.chatparticipant_set.exclude(participant=user)
        return ChatParticipantSerializer(participants, many=True).data
    
    def get_inviter(self, obj):
        user = self.context['request'].user.interactuser.timeline_user
        first_message = obj.messages.order_by('timestamp').first()
        if first_message:
            inviter = first_message.sender
        else:
            inviter = user
        participant = obj.chatparticipant_set.get(participant=inviter)
        return ChatParticipantSerializer(participant).data
    
    def get_me(self, obj):
        user = self.context['request'].user.interactuser.timeline_user
        try:
            participant = obj.chatparticipant_set.get(participant=user)
            return ChatParticipantSerializer(participant).data
        except ChatParticipant.DoesNotExist:
            return None
    


class UserChatSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    uuid = serializers.UUIDField()
    inviter = serializers.SerializerMethodField()
    restricted = serializers.SerializerMethodField()
    me = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = ['id', 'uuid', 'restricted', 'participants', 'inviter', 'me']

    def get_participants(self, obj):
        user = self.context['request'].user.interactuser.timeline_user
        participants = obj.chatparticipant_set.exclude(participant=user)
        return ChatParticipantSerializer(participants, many=True).data

    def get_inviter(self, obj):
        user = self.context['request'].user.interactuser.timeline_user
        first_message = obj.messages.order_by('timestamp').first()
        if first_message:
            inviter = first_message.sender
        else:
            inviter = user
        participant = obj.chatparticipant_set.get(participant=inviter)
        return ChatParticipantSerializer(participant).data

    def get_restricted(self, obj):
        # Assuming you want to check if the current user is restricted in this chat
        user = self.context['request'].user.interactuser.timeline_user
        try:
            participant = obj.chatparticipant_set.get(participant=user)
            return participant.restricted
        except ChatParticipant.DoesNotExist:
            return False  # Assuming default behavior if participant not found

        
    def get_me(self, obj):
        user = self.context['request'].user.interactuser.timeline_user
        participant = obj.chatparticipant_set.get(participant=user)
        return ChatParticipantSerializer(participant).data
