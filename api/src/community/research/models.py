# research/models.py
from django.db import models
import uuid
from src.community.models import Community
from src.user.models import BaseUser

def research_file_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'research/{instance.community.id}/{uuid.uuid4()}.{ext}'

class ResearchPublication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='research_publications')
    title = models.CharField(max_length=255)
    abstract = models.TextField()
    file = models.FileField(upload_to=research_file_upload_path)
    created_by = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class PeerReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publication = models.ForeignKey(ResearchPublication, on_delete=models.CASCADE, related_name='peer_reviews')
    reviewer = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    content = models.TextField()
    rating = models.IntegerField(default=0)
    anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Preprint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='preprints')
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to=research_file_upload_path)
    created_by = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class Dataset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='datasets')
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to=research_file_upload_path, null=True, blank=True)
    link = models.URLField(blank=True, null=True)
    created_by = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class CollaborationCall(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='collaboration_calls')
    title = models.CharField(max_length=255)
    description = models.TextField()
    required_skills = models.TextField()
    created_by = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)