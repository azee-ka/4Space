from django.db import models
import uuid
from ..models import Community
from django.conf import settings

class DiscussionPost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='discussions')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    upvotes = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)  # for fast lookup (update in logic)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.community.name}] {self.title[:30]}"
