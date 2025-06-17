# space/repos/models.py
import uuid
from django.db import models
from django.conf import settings
from ..projects.models import Project
from ..library.models import LibraryItem

class Repository(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=False)
    collaborators = models.ManyToManyField(settings.AUTH_PROFILE_MODEL, related_name="repo_collaborators", blank=True)
    tags = models.CharField(max_length=255, blank=True)
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class RepositoryProject(models.Model):
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name="linked_projects")
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    alias = models.CharField(max_length=255, blank=True)
    pinned = models.BooleanField(default=False)

class RepositoryLibraryItem(models.Model):
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name="linked_items")
    item = models.ForeignKey(LibraryItem, on_delete=models.CASCADE)
    alias = models.CharField(max_length=255, blank=True)
    path = models.CharField(max_length=512, blank=True)
    pinned = models.BooleanField(default=False)

class RepositoryTask(models.Model):
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_PROFILE_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    is_done = models.BooleanField(default=False)
    priority = models.CharField(max_length=20, default="normal")  # high/normal/low
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class RepositoryNote(models.Model):
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

