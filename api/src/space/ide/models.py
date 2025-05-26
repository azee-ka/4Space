# space/ide/models.py
from django.db import models
from ..models import Project

class CodeFile(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="code_files")
    filename = models.CharField(max_length=255)
    language = models.CharField(max_length=30, default="javascript")
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("project", "filename")

    def __str__(self):
        return f"{self.project.title}/{self.filename}"
