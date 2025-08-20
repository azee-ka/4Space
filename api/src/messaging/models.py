# src/messaging/models.py

import uuid
from django.db import models
from django.utils.timezone import now
from ..user.models import BaseUser

def attachment_upload_path(instance, filename):
    # e.g. attachments/<conversation_uuid>/<message_uuid>/<filename>
    return f"attachments/{instance.message.conversation.uuid}/{instance.message.uuid}/{filename}"

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        'Message',
        related_name='attachments',
        on_delete=models.CASCADE
    )
    file = models.FileField(upload_to=attachment_upload_path)
    mime_type = models.CharField(max_length=100)  # e.g. "image/png", "video/mp4", "application/pdf"
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment {self.id} ({self.mime_type}) for message {self.message.uuid}"



class Reaction(models.Model):
    REACTION_CHOICES = [
        ('like', '👍'),
        ('love', '❤️'),
        ('laugh', '😂'),
        ('sad', '😢'),
        ('angry', '😡'),
        # ... you can expand this list or let users supply custom emoji/unicode
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        'Message',
        related_name='reactions',
        on_delete=models.CASCADE
    )
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=20, choices=REACTION_CHOICES)
    reacted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'reaction_type')

    def __str__(self):
        return f"{self.user.username} reacted {self.reaction_type} on {self.message.uuid}"
    
    

class Conversation(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # Add UUID field
    participants = models.ManyToManyField(BaseUser, related_name='conversations_participated_in')  # Unique related_name
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        participant_usernames = ', '.join([user.username for user in self.participants.all()])
        return f"Conversation between: {participant_usernames}"

    class Meta:
        ordering = ['-created_at']  # Optional: Sort conversations by creation time in reverse order

    def delete_if_empty(self):
        """Delete the conversation if no messages are present and it's an invitation."""
        if not self.messages.exists():
            self.delete()
            

class Message(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # Add UUID field
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    deleted_for = models.ManyToManyField(BaseUser, related_name='deleted_messages', blank=True)

    parent_message = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        related_name='thread_replies',
        on_delete=models.SET_NULL
    )
    
    def delete_for_user(self, user):
        self.deleted_for.add(user)

    def __str__(self):
        preview = (self.text[:30] + "...") if self.text else f"Attachment message {self.uuid}"
        return f"Message from {self.sender.username}: {preview}"
    
    
    
class Participant(models.Model):
    STATUS_CHOICES = [
        ('added', 'Added'),  # User added, but can't see the conversation yet
        ('invited', 'Invited'),  # Invitation sent, but not accepted or declined
        ('active', 'Active'),  # User is active in the conversation (can see and participate)
        ('blocked', 'Blocked'),  # User blocked by admin or creator
    ]

    ACTIVITY_STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('inactive', 'Inactive'),
    ]

    ROLE_CHOICES = [
        ('creator', 'Creator'),
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]

    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    conversation = models.ForeignKey(Conversation, related_name='participant_records', on_delete=models.CASCADE)  # Unique related_name
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='added')
    invitation_sent_at = models.DateTimeField(null=True, blank=True)
    invitation_accepted_at = models.DateTimeField(null=True, blank=True)
    invitation_declined_at = models.DateTimeField(null=True, blank=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} in {self.conversation.uuid} - {self.role} - {self.status}"

    class Meta:
        unique_together = ('user', 'conversation')

        
    
    
class MessageSettings(models.Model):
    user = models.OneToOneField(BaseUser, on_delete=models.CASCADE, related_name='message_settings')
    allow_messages_from_followers = models.CharField(
        max_length=20,
        choices=[
            ('allow', 'Allow Messages'),
            ('requests', 'Requests Only'),
            ('no-requests', 'No Requests')
        ],
        default='requests'
    )
    allow_messages_from_others = models.CharField(
        max_length=20,
        choices=[
            ('allow', 'Allow Messages'),
            ('requests', 'Requests Only'),
            ('no-requests', 'No Requests')
        ],
        default='no-requests'
    )

    def __str__(self):
        return f"{self.user.username}'s message settings"
    
    
    
    
    
    
    
    
class Lane(models.Model):
    """
    Per-conversation context lane (aka sub-thread/scope) for 1:1 (or group).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey('Conversation', on_delete=models.CASCADE, related_name='lanes')
    title = models.CharField(max_length=40, default="Main")
    emoji = models.CharField(max_length=8, blank=True, default="")
    color = models.CharField(max_length=7, blank=True, default="#0A84FF")
    rules = models.JSONField(default=dict, blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # No unique_together. If you want a non-unique index, uncomment:
        # indexes = [models.Index(fields=['conversation', 'title'], name='lane_conv_title_idx')]
        pass

    def __str__(self):
        return f"{self.conversation.uuid} • {self.title}"

# Add 2 fields to Conversation
def conversation_mode_default():
    return "personal"

Conversation.add_to_class("mode", models.CharField(
    max_length=16,
    default=conversation_mode_default,
    choices=[(m, m) for m in ["personal","work","family","dating","travel","events","wellness"]]
))
Conversation.add_to_class("theme", models.JSONField(default=dict, blank=True))  # optional

# Link Message to Lane (nullable for legacy)
Message.add_to_class("lane", models.ForeignKey(Lane, null=True, blank=True, on_delete=models.SET_NULL, related_name="messages"))