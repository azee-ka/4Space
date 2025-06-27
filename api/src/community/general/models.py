# src/apps/communities/community/models.py

import uuid
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from src.post.models import Vote        # ← adjust this import to your Vote location

from ..models import Community


class ExchangePost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(
        Community, on_delete=models.CASCADE, related_name='exchanges'
    )
    author = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='exchange_posts'
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # generic up/down votes
    votes = GenericRelation(Vote, related_query_name='exchange_posts')

    # denormalized count of top-level replies
    comments_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.community.name}] {self.title[:30]}"


class ExchangeReply(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(
        ExchangePost, on_delete=models.CASCADE, related_name='comments'
    )
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    author = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='exchange_replies'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # generic up/down votes
    votes = GenericRelation(Vote, related_query_name='exchange_replies')

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply by {self.author} on {self.post}"
