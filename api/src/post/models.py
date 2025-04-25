import uuid
from django.db import models
from django.conf import settings
from django.db import models
from django.utils import timezone
import uuid
import os
from PIL import Image
import io
import os
from django.core.files.base import ContentFile
from django.conf import settings
# from ..utils.parser import TextFieldMixin
from ..user.models import BaseUser



MEDIA_TYPE_MAPPING = {
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'bmp': 'image',
    'tiff': 'image',
    'mp4': 'video',
    'avi': 'video',
    'mov': 'video',
    'wmv': 'video',
    'mkv': 'video',
    # Add more extensions as needed
}

class MediaFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='post_media/')
    media_type = models.CharField(max_length=10, default="default")
    order = models.IntegerField(default=0)
    quality = models.CharField(max_length=50, default='720p')  # Store quality as string (e.g., '720p', '1080p')

    def save(self, *args, **kwargs):
        extension = self.file.name.split('.')[-1].lower()
        self.media_type = MEDIA_TYPE_MAPPING.get(extension, 'unknown')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.media_type} - {self.quality}"

    def get_video_qualities(self):
        """Generate and return available video qualities (144p to 2160p)"""
        if self.media_type == 'video':
            # Example hardcoded qualities (can be dynamically generated with FFmpeg)
            qualities = [
                {'quality': '144p', 'url': self._get_video_url_for_quality('144p')},
                {'quality': '240p', 'url': self._get_video_url_for_quality('240p')},
                {'quality': '360p', 'url': self._get_video_url_for_quality('360p')},
                {'quality': '480p', 'url': self._get_video_url_for_quality('480p')},
                {'quality': '720p', 'url': self._get_video_url_for_quality('720p')},
                {'quality': '1080p', 'url': self._get_video_url_for_quality('1080p')},
                {'quality': '1440p', 'url': self._get_video_url_for_quality('1440p')},
                {'quality': '2160p', 'url': self._get_video_url_for_quality('2160p')}
            ]
            return qualities
        return []

    def _get_video_url_for_quality(self, quality):
        """Generate URL based on the quality requested."""
        base_filename = os.path.splitext(self.file.name)[0]
        file_extension = os.path.splitext(self.file.name)[1]
        quality_filename = f"{base_filename}_{quality}{file_extension}"

        return os.path.join(settings.MEDIA_URL, 'quality_videos', quality_filename)
    
    
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
    content = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'Thread - {self.user.username} - {self.created_at}'


class VisualPost(BasePost):
    content = models.TextField(blank=True, null=True)
    media_files = models.ManyToManyField('post.MediaFile', blank=True)

    def __str__(self):
        return f'Visual - {self.user.username} - {self.created_at}'


class PollPost(BasePost):
    question = models.CharField(max_length=255)
    options = models.JSONField(default=list)  # Store poll options
    expiration_date = models.DateTimeField()

    def __str__(self):
        return f'Poll - {self.user.username} - {self.created_at}'


class StoryPost(BasePost):
    content = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'Story - {self.user.username} - {self.created_at}'


class EventPost(BasePost):
    title = models.CharField(max_length=255)
    event_date = models.DateTimeField()

    def __str__(self):
        return f'Event - {self.user.username} - {self.created_at}'


class AudioPost(BasePost):
    audio_file = models.FileField(upload_to='audio_files/')

    def __str__(self):
        return f'Audio - {self.user.username} - {self.created_at}'
