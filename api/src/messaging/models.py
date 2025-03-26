import uuid
from django.db import models
from django.utils.timezone import now
from ..user.models import BaseUser

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
    text = models.TextField()
    sent_at = models.DateTimeField(default=now)
    read = models.BooleanField(default=False)
    deleted_for = models.ManyToManyField(BaseUser, related_name='deleted_messages', blank=True)

    def delete_for_user(self, user):
        self.deleted_for.add(user)

    def __str__(self):
        return f"Message from {self.sender.username}: {self.text[:30]}"
    
    
    
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