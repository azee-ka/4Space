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

class UserShare(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey('post.Post', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class UserSave(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey('post.Post', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
