from django.conf import settings
from django.db import models
from django.utils import timezone
from ..user.models import BaseUser
import uuid
import os
from django.conf import settings
from PIL import Image
import io
import os
from django.core.files.base import ContentFile
from moviepy import VideoFileClip
from django.conf import settings
from ..utils.parser import TextFieldMixin

class Vote(models.Model):
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    comment = models.ForeignKey('Comment', on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=10, choices=[('upvote', 'Upvote'), ('downvote', 'Downvote')])

    class Meta:
        unique_together = ('user', 'comment')  # Enforces that each user can only vote once on a specific comment

    @classmethod
    def upvotes(cls, comment):
        return cls.objects.filter(comment=comment, vote_type='upvote')

    @classmethod
    def downvotes(cls, comment):
        return cls.objects.filter(comment=comment, vote_type='downvote')



class Comment(models.Model, TextFieldMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flare = models.ForeignKey('Flare', related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # Use a single ManyToMany field for votes
    votes = models.ManyToManyField(BaseUser, through='Vote', related_name='voted_comments')

    likes = models.ManyToManyField(BaseUser, related_name='liked_comments', blank=True)
    # Field to count likes
    likes_count = models.PositiveIntegerField(default=0)

    # Replies (self-referential foreign key)
    parent_comment = models.ForeignKey('self', related_name='replies', null=True, blank=True, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.text = self.parse_and_store_references(self.text, self._meta.app_label, self.__class__.__name__, self.pk)
        super().save(update_fields=['text'])
        
    def __str__(self):
        return f"Comment by {self.author.username}"

    def update_like_count(self):
        """ Updates the likes count based on the number of likes """
        self.likes_count = self.likes.count()
        self.save()

    @property
    def is_reply(self):
        """ Check if this comment is a reply to another comment """
        return self.parent_comment is not None

    def add_upvote(self, user):
        """ Adds upvote if the user hasn't already voted """
        if not Vote.objects.filter(user=user, comment=self).exists():
            Vote.objects.create(user=user, comment=self, vote_type='upvote')
        else:
            raise ValueError("User has already upvoted this comment.")

    def add_downvote(self, user):
        """ Adds downvote if the user hasn't already voted """
        if not Vote.objects.filter(user=user, comment=self).exists():
            Vote.objects.create(user=user, comment=self, vote_type='downvote')
        else:
            raise ValueError("User has already downvoted this comment.")

    def add_like(self, user):
        """ Adds like to comment if the user hasn't already liked """
        if user not in self.likes.all():
            self.likes.add(user)
            self.update_like_count()
        else:
            raise ValueError("User has already liked this comment.")

    def remove_like(self, user):
        """ Removes like from comment if the user has liked """
        if user in self.likes.all():
            self.likes.remove(user)
            self.update_like_count()
        else:
            raise ValueError("User has not liked this comment.")



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
    



class Flare(models.Model, TextFieldMixin):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    author = models.ForeignKey(BaseUser, on_delete=models.SET_NULL, null=True, related_name='authored_flares')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    text = models.TextField(blank=True)  # Make the text field optional
    media_files = models.ManyToManyField(MediaFile, related_name='post_media')
    created_at = models.DateTimeField(auto_now_add=True)
    likes_count = models.PositiveIntegerField(default=0)  # Field for the number of likes
    comments_count = models.PositiveIntegerField(default=0)  # Field for the number of comments
    likes = models.ManyToManyField(BaseUser, related_name='liked_posts', blank=True)
    dislikes_count = models.PositiveIntegerField(default=0)  # Field for the number of dislikes
    dislikes = models.ManyToManyField(BaseUser, related_name='disliked_posts', blank=True)

    thumbnail = models.ImageField(upload_to='thumbnails/', blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.text = self.parse_and_store_references(self.text, self._meta.app_label, self.__class__.__name__, self.pk)
        super().save(update_fields=['text'])
        
    def __str__(self):
        return f"Post by {self.user.username}"
    
    def add_like(self, user):
        """ Adds like to the post if the user hasn't already liked """
        if user not in self.likes.all():
            self.likes.add(user)
            self.update_like_count()
        else:
            raise ValueError("User has already liked this post.")

    def remove_like(self, user):
        """ Removes like from the post if the user has liked """
        if user in self.likes.all():
            self.likes.remove(user)
            self.update_like_count()
        else:
            raise ValueError("User has not liked this post.")
        
    def update_like_count(self):
        """ Updates the likes count based on the number of likes """
        self.likes_count = self.likes.count()
        self.save()