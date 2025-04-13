import uuid
from django.db import models
from ..user.models import BaseUser

class BasePost(models.Model):
    VISIBILITY_CHOICES = [
        ('Private', 'Private'),
        ('Public', 'Public'),
        ('Friends', 'Friends Only'),
        ('Select', 'Select People'),
        ('Exclude', 'Exclude People'),
    ]

    RESTRICTION_CHOICES = [
        ('SFW', 'Safe for Work'),
        ('NSFW', 'Not Safe for Work'),
    ]

    COMMENTS_CHOICES = [
        ('Allow', 'Allow Comments'),
        ('Disable', 'Disable Comments'),
        ('Friends', 'Friends Only'),
        ('Approval', 'Require Approval'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE)  # No related_name here
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='Private')
    restriction = models.CharField(max_length=10, choices=RESTRICTION_CHOICES, default='SFW')
    comments_setting = models.CharField(max_length=10, choices=COMMENTS_CHOICES, default='Allow')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # This makes the model abstract so it won't be used directly.

    def __str__(self):
        return f'{self.user.username} - {self.__class__.__name__} - {self.created_at}'


class ThreadPost(BasePost):
    user = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE, related_name='thread_posts')
    content = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'Thread - {self.user.username} - {self.created_at}'


class VisualPost(BasePost):
    user = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE, related_name='visual_posts')
    content = models.TextField(blank=True, null=True)
    media_files = models.JSONField(default=list, blank=True)  # Stores media file URLs

    def __str__(self):
        return f'Visual - {self.user.username} - {self.created_at}'


class PollPost(BasePost):
    user = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE, related_name='poll_posts')
    question = models.CharField(max_length=255)
    options = models.JSONField(default=list)  # Store poll options
    expiration_date = models.DateTimeField()

    def __str__(self):
        return f'Poll - {self.user.username} - {self.created_at}'


class StoryPost(BasePost):
    user = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE, related_name='story_posts')
    content = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'Story - {self.user.username} - {self.created_at}'


class EventPost(BasePost):
    user = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE, related_name='event_posts')
    title = models.CharField(max_length=255)
    event_date = models.DateTimeField()

    def __str__(self):
        return f'Event - {self.user.username} - {self.created_at}'


class AudioPost(BasePost):
    user = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE, related_name='audio_posts')
    audio_file = models.FileField(upload_to='audio_files/')

    def __str__(self):
        return f'Audio - {self.user.username} - {self.created_at}'
