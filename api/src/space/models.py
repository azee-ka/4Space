from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid
from ..user.models import BaseUser

class Space(models.Model):
    class Privacy(models.TextChoices):
        PUBLIC = 'public', _('Public')
        PRIVATE = 'private', _('Private')
        INVITE_ONLY = 'invite-only', _('Invite-Only')

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(BaseUser, on_delete=models.SET_NULL, null=True, related_name='owned_spaces', editable=False)
    privacy = models.CharField(max_length=20, choices=Privacy.choices, default=Privacy.PRIVATE)
    category = models.CharField(max_length=100, default='general')
    theme = models.CharField(max_length=100, default='default')  # e.g., light, dark, custom themes
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # More complex configurations for the space
    custom_css = models.TextField(blank=True, null=True)  # Allow custom CSS for flexible design
    template = models.CharField(max_length=100, blank=True, null=True)  # Custom templates

    def __str__(self):
        return self.name
        

class SpaceMembership(models.Model):
    class Role(models.TextChoices):
        OWNER = 'owner', _('Owner')
        ADMIN = 'admin', _('Admin')
        MEMBER = 'member', _('Member')
        VIEWER = 'viewer', _('Viewer')

    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.VIEWER)
    can_customize = models.BooleanField(default=False)  # Allow admins/members to customize widgets and layout

    class Meta:
        unique_together = ('user', 'space')

    def __str__(self):
        return f"{self.user.username} - {self.role} of {self.space.name}"

class Widget(models.Model):
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='widgets')
    widget_type = models.CharField(max_length=50)
    config = models.JSONField()  # Store widget-specific configurations
    position = models.JSONField()  # {x: 0, y: 0, width: 100, height: 100}
    settings = models.JSONField(default=dict)  # Store customizable settings for the widget
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.widget_type} Widget for {self.space.name}"
