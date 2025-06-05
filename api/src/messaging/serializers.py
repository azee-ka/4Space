from rest_framework import serializers
from .models import Conversation, Message, Participant, Attachment, Reaction
from ..user.models import BaseUser
from ..user.serializers import MentionUserSearchSerializer



class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ['id', 'mime_type', 'url', 'uploaded_at']

    def get_url(self, obj):
        request = self.context.get('request')
        # Build absolute URL for the file
        return request.build_absolute_uri(obj.file.url)
    
class ReactionSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Reaction
        fields = ['id', 'user_username', 'reaction_type', 'reacted_at']


    
class ParticipantSerializer(serializers.ModelSerializer):
    user = MentionUserSearchSerializer()
    role = serializers.ChoiceField(choices=Participant.ROLE_CHOICES)
    status = serializers.ChoiceField(choices=Participant.STATUS_CHOICES)
    last_seen_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', required=False)
    invitation_sent_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', required=False)

    class Meta:
        model = Participant
        fields = [
            'user', 'role', 'status', 'last_seen_at', 'invitation_sent_at',
        ]


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    attachments = AttachmentSerializer(many=True, read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)
    parent_message_uuid = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'uuid',
            'conversation',
            'sender',
            'sender_username',
            'text',
            'sent_at',
            'read',
            'attachments',
            'reactions',
            'parent_message_uuid',
        ]
        read_only_fields = ['sender', 'conversation', 'uuid', 'sent_at', 'read']

    def get_parent_message_uuid(self, obj):
        return obj.parent_message.uuid if obj.parent_message else None




class ConversationSerializer(serializers.ModelSerializer):
    view_type = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    conversation_status = serializers.SerializerMethodField() 
    
    class Meta:
        model = Conversation
        fields = ['uuid', 'participants', 'created_at', 'view_type', 'conversation_status']

    def get_participants(self, obj):
        # Fetch all participants excluding the current user
        current_user = self.context['request'].user
        participants = Participant.objects.filter(conversation=obj).exclude(user=current_user)
        return ParticipantSerializer(participants, many=True).data

    def get_view_type(self, obj):
        # Determine the view type based on the user's status in the conversation
        current_user = self.context['request'].user
        participant = Participant.objects.filter(conversation=obj, user=current_user).first()
        print(f'partici: {participant}')
        if participant and participant.status == 'invited':
            return 'request'
        return 'inbox'
    
    def get_conversation_status(self, obj):
        """
        Determine the conversation status based on the message settings and follow status.
        For group chats, the status is 'invite' unless there's at least one active participant.
        """
        current_user = self.context['request'].user
        participants = Participant.objects.filter(conversation=obj).exclude(user=current_user)
    
        # Check for group chat logic
        if len(participants) > 1:
            if participants.filter(status='active').exists():
                return 'allowed'
            return 'invite'

        if participants.exists():
            first_participant = participants.first()
            # Check if the first participant is active
            if first_participant.status == 'active':
                return 'allowed'
            recipient = first_participant.user
            message_settings = recipient.message_settings

            # Check if the conversation creator follows the recipient
            if current_user.is_following(recipient):
                # Follow settings for followers
                if message_settings.allow_messages_from_followers == 'no-requests':
                    return 'blocked'
                elif message_settings.allow_messages_from_followers == 'requests':
                    return 'invite'
            else:
                # Follow settings for non-followers
                if message_settings.allow_messages_from_others == 'no-requests':
                    return 'blocked'
                elif message_settings.allow_messages_from_others == 'requests':
                    return 'invite'
        return 'allowed'

        
        
        
        
class ConversationListSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    group_participant_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['uuid', 'other_participant', 'group_participant_count', 'created_at']

    def get_other_participant(self, obj):
        # For 1-on-1 chats, return the other participant
        current_user = self.context['request'].user
        
        # Get all participants for the conversation, excluding the current user
        participant = Participant.objects.filter(conversation=obj).exclude(user=current_user).first()

        if participant:
            # Serialize the other participant's data
            return ParticipantSerializer(participant).data
        return None

    def get_group_participant_count(self, obj):
        # For group chats, count the active participants excluding the current user
        current_user = self.context['request'].user
        
        # Query to count active participants (excluding the current user) in the conversation
        active_participants_count = Participant.objects.filter(conversation=obj).exclude(user=current_user).count()

        return active_participants_count