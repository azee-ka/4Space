# src/post/models.py

from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
import uuid

class CommentManager(models.Manager):
    def get_queryset(self):
        # We will customize the queryset to ensure the caption comment is always on top
        return super().get_queryset().annotate(
            is_caption=models.Case(
                models.When(text=models.F('post__caption'), then=0),
                default=1,
                output_field=models.IntegerField(),
            )
        ).order_by('is_caption', 'created_at')
        
class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey('Post', related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey('timelineUser.TimelineUser', on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.interactuser.user.username}"

class MediaFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='post_media/')
    media_type = models.CharField(max_length=10, default="default")
    order = models.IntegerField(default=0)
    
class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('timelineUser.TimelineUser', on_delete=models.CASCADE)
    caption = models.TextField(blank=True, null=True)
    media_files = models.ManyToManyField(MediaFile, related_name='post_media', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes_count = models.PositiveIntegerField(default=0)  # Field for the number of likes
    comments_count = models.PositiveIntegerField(default=0)  # Field for the number of comments
    likes = models.ManyToManyField('timelineUser.TimelineUser', related_name='liked_posts', blank=True)
    dislikes_count = models.PositiveIntegerField(default=0)  # Field for the number of dislikes
    dislikes = models.ManyToManyField('timelineUser.TimelineUser', related_name='disliked_posts', blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        PostFeatures.objects.get_or_create(post=self)

        
    def __str__(self):
        return f"Post by {self.user.interactuser.user.username}"
    
    
class PostFeatures(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name='features')
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    share_count = models.PositiveIntegerField(default=0)
    save_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Features of Post {self.post.id}"