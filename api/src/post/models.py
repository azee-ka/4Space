# src/post/models.py

from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
import uuid

class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey('Post', related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey('timelineUser.TimelineUser', on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username}"

class MediaFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='post_media/')
    media_type = models.CharField(max_length=10, default="default")
    order = models.IntegerField(default=0)
    
class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('timelineUser.TimelineUser', on_delete=models.CASCADE)
    text = models.TextField(blank=True)  # Make the text field optional
    media_files = models.ManyToManyField(MediaFile, related_name='post_media', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes_count = models.PositiveIntegerField(default=0)  # Field for the number of likes
    comments_count = models.PositiveIntegerField(default=0)  # Field for the number of comments
    likes = models.ManyToManyField('timelineUser.TimelineUser', related_name='liked_posts', blank=True)
    dislikes_count = models.PositiveIntegerField(default=0)  # Field for the number of dislikes
    dislikes = models.ManyToManyField('timelineUser.TimelineUser', related_name='disliked_posts', blank=True)


    def __str__(self):
        return f"Post by {self.user.username}"