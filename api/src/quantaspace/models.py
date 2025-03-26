from django.db import models
from django.utils import timezone
from ..user.models import BaseUser
import uuid

def upload_to(instance, filename):
    return f'packets/{instance.author.username}/{filename}'

class Flag(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return self.name
   
   
PACKET_TYPE_CHOICES = [
    ('announcement', 'Announcement'),
    ('idea', 'Idea'),
    ('question', 'Question'),
    ('poll', 'Poll'),
]
    
class Packet(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    author = models.ForeignKey(BaseUser, on_delete=models.SET_NULL, null=True, related_name='authored_packets')
    content = models.TextField()
    is_sensitive = models.BooleanField(default=False)  # Required field
    is_private = models.BooleanField(default=True)  # Required field
    packet_type = models.CharField(max_length=50, choices=PACKET_TYPE_CHOICES, default='announcement')  # Required field
    uploaded_files = models.JSONField(default=list, blank=True)  # Required field

    # Optional fields
    hashtags = models.JSONField(default=list, blank=True)
    mentions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    retweet_count = models.PositiveIntegerField(default=0)
    reply_count = models.PositiveIntegerField(default=0)
    pinned = models.BooleanField(default=False)
    poll_options = models.JSONField(default=list, blank=True)
    poll_votes = models.JSONField(default=dict, blank=True)
    mood = models.CharField(max_length=50, blank=True, null=True)

    # Scoring and Metrics
    likes_count = models.PositiveIntegerField(default=0)
    dislikes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    retweets = models.PositiveIntegerField(default=0)

    likes = models.ManyToManyField(BaseUser, related_name='liked_packets', blank=True)
    dislikes = models.ManyToManyField(BaseUser, related_name='disliked_packets', blank=True)
    
    flags = models.ManyToManyField('Flag', related_name='flagged_packets', blank=True)

    # Relationships to allow reference or association with other packets
    related_packet = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.CASCADE, related_name='related_to'
    )
    replies = models.ManyToManyField('self', symmetrical=True)

    def update_metrics(self):
        """Update metrics: net votes, related packets, etc."""
        self.retweet_count = self.related_packet.count() if self.related_packet else 0  # Count related packets
        self.save()

    def __str__(self):
        return f'Packet by {self.author.get_current_username()}'