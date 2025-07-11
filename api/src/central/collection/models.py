# src/collection/models.py
import uuid
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

VISIBILITY_CHOICES = [
    ('private', 'Private'),
    ('followers', 'Followers'),
    ('public', 'Public'),
]

class Collection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='collections'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default='private'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class CollectionItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='items')
    added_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='collection_items'
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    added_at = models.DateTimeField(auto_now_add=True)
    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default='private'
    )

    class Meta:
        unique_together = ('collection', 'content_type', 'object_id')

    def __str__(self):
        return f"{self.content_type} - {self.object_id}"
