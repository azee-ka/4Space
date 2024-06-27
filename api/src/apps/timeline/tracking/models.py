# tracking/models.py

from django.db import models
from django.conf import settings

class UserLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey('post.Post', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class UserComment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey('post.Post', on_delete=models.CASCADE)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class PostFeatures(models.Model):
    post = models.OneToOneField('post.Post', on_delete=models.CASCADE, related_name='features')
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    share_count = models.PositiveIntegerField(default=0)
    save_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class UserShare(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey('post.Post', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class UserSave(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey('post.Post', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
