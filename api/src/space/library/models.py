# space/library/models.py
import uuid
from django.db import models
from django.conf import settings
from ..projects.models import Project

class LibraryItem(models.Model):
    FILE_TYPES = [
        ("file", "File"),
        ("folder", "Folder"),
        ("project", "Project"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=FILE_TYPES)
    file = models.FileField(upload_to="library/", null=True, blank=True)
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.CASCADE)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="children"
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_shared = models.BooleanField(default=False)
    share_token = models.UUIDField(null=True, blank=True, unique=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def generate_share_token(self):
        if not self.share_token:
            self.share_token = uuid.uuid4()
            self.save()
        return self.share_token

    @property
    def shareable_url(self):
        if not self.is_shared:
            return None
        return f"{settings.FRONTEND_URL}/library/shared/{self.share_token}"
