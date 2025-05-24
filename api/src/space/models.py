import uuid
from django.db import models
from django.conf import settings

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    TOOL_CHOICES = [
        ("markdown", "Markdown"),
        ("richtext", "Rich Text"),
        ("latex", "LaTeX"),
        ("code", "Code"),
        ("notebook", "Notebook"),
        ("mindmap", "Mind Map"),
    ]

    title = models.CharField(max_length=255)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    tool_type = models.CharField(max_length=50, choices=TOOL_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    config = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.title} ({self.tool_type})"


class MarkdownContent(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="markdown")
    content = models.TextField()

class RichTextContent(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="richtext")
    content = models.TextField()

class LaTeXContent(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="latex")
    content = models.TextField()

class CodeContent(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="code")
    language = models.CharField(max_length=30, default="javascript")
    code = models.TextField()

class NotebookContent(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="notebook")
    cells = models.JSONField(default=list)  # [{type, input, output}]
