from django.conf import settings
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
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
from django.contrib.contenttypes.fields import GenericRelation


from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Vote(models.Model):
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=10, choices=[('upvote', 'Upvote'), ('downvote', 'Downvote')])

    # Generalized foreign key (post OR comment)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        unique_together = ('user', 'content_type', 'object_id')  # User votes only once per object

    @classmethod
    def upvotes(cls, obj):
        ct = ContentType.objects.get_for_model(obj)
        return cls.objects.filter(content_type=ct, object_id=obj.id, vote_type='upvote')

    @classmethod
    def downvotes(cls, obj):
        ct = ContentType.objects.get_for_model(obj)
        return cls.objects.filter(content_type=ct, object_id=obj.id, vote_type='downvote')




class Comment(models.Model, TextFieldMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()  # UUID because your posts use UUIDs
    post = GenericForeignKey('content_type', 'object_id')
    
    author = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    votes = GenericRelation('post.Vote', related_query_name='comment')
    
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
    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'bmp': 'image', 'tiff': 'image',
    'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video', 'mkv': 'video',
}

class MediaFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='post_media/')
    media_type = models.CharField(max_length=10, default="default")
    order = models.IntegerField(default=0)
    quality = models.CharField(max_length=50, default='720p')

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
        ('Private', 'Private'), ('Public', 'Public'), ('Friends', 'Friends Only'),
        ('Select', 'Select People'), ('Exclude', 'Exclude People'),
    ]
    RESTRICTION_CHOICES = [('SFW', 'Safe for Work'), ('NSFW', 'Not Safe for Work')]
    COMMENTS_CHOICES = [('Allow', 'Allow Comments'), ('Disable', 'Disable Comments'), 
                        ('Friends', 'Friends Only'), ('Approval', 'Require Approval')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='Private')
    restriction = models.CharField(max_length=10, choices=RESTRICTION_CHOICES, default='SFW')
    comments_setting = models.CharField(max_length=10, choices=COMMENTS_CHOICES, default='Allow')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    comments = GenericRelation(Comment, related_query_name='post')

    likes = models.ManyToManyField(
        BaseUser, 
        related_name="%(class)s_liked_posts", 
        blank=True
    )
    dislikes = models.ManyToManyField(
        BaseUser, 
        related_name="%(class)s_disliked_posts", 
        blank=True
    )
    likes_count = models.PositiveIntegerField(default=0)
    dislikes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)


    parent_post = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children_reposts'
    )
    quote_comment = models.TextField(blank=True, null=True)
    quote_text = models.TextField(blank=True, null=True)

    views_count = models.PositiveIntegerField(default=0)

    class Meta:
        abstract = True

    def __str__(self):
        return f'{self.author.username} - {self.__class__.__name__} - {self.created_at}'
    
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
        
    @property
    def is_repost(self):
        return bool(self.parent_post and not self.quote_comment)

    @property
    def is_quote(self):
        return bool(self.parent_post and self.quote_comment)
    
    @property
    def reposts_count(self):
        # Children reposts: direct reposts that are not quotes
        return self.__class__.objects.filter(parent_post=self, quote_comment__isnull=True, quote_text__isnull=True).count()





class PostView(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()  # UUID because your posts use UUIDs
    post = GenericForeignKey('content_type', 'object_id')

    user = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=64, blank=True, null=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=256)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=['content_type', 'object_id', 'user']),
            models.Index(fields=['content_type', 'object_id', 'session_id']),
        ]
        
        
        
        
class ThreadPost(BasePost):
    content = models.TextField(default="", blank=False, null=False)
    media_files = models.ManyToManyField('post.MediaFile', blank=True)
    votes = GenericRelation(Vote, related_query_name='threadpost')

    # Poll-specific
    poll_question = models.CharField(max_length=255, blank=True, null=True)
    poll_options = models.JSONField(default=list, blank=True)
    poll_expiration_date = models.DateTimeField(blank=True, null=True)

    # Event-specific
    event_title = models.CharField(max_length=255, blank=True, null=True)
    event_date = models.DateTimeField(blank=True, null=True)

    def add_upvote(self, user):
        ct = ContentType.objects.get_for_model(self)
        if not Vote.objects.filter(user=user, content_type=ct, object_id=self.id).exists():
            Vote.objects.create(user=user, content_type=ct, object_id=self.id, vote_type='upvote')
        else:
            raise ValueError("User has already upvoted this post.")

    def add_downvote(self, user):
        ct = ContentType.objects.get_for_model(self)
        if not Vote.objects.filter(user=user, content_type=ct, object_id=self.id).exists():
            Vote.objects.create(user=user, content_type=ct, object_id=self.id, vote_type='downvote')
        else:
            raise ValueError("User has already downvoted this post.")


    def __str__(self):
        return f'Thread - {self.user.username} - {self.created_at}'


class VisualPost(BasePost):
    caption = models.TextField(blank=True, null=True)
    media_files = models.ManyToManyField('post.MediaFile')

    def __str__(self):
        return f'Visual - {self.user.username} - {self.created_at}'
