# api/src/space/space/models.py

import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Space(models.Model):
    """
    A customizable workspace/dashboard for organizing tools and content.
    Similar to Repository model but for personal/team workspaces.
    """
    PRIVACY_CHOICES = [
        ('private', 'Private'),
        ('team', 'Team'),
        ('public', 'Public'),
    ]
    
    TYPE_CHOICES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
        ('collaborative', 'Collaborative'),
        ('educational', 'Educational'),
        ('creative', 'Creative'),
        ('finance', 'Finance'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    definition = models.TextField(blank=True, help_text="Space purpose/description")
    
    # Owner is the BaseUser handle
    owner = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,  # BaseUser
        on_delete=models.CASCADE,
        related_name='owned_spaces'
    )
    
    # Collaborators are also BaseUser handles
    collaborators = models.ManyToManyField(
        settings.AUTH_PROFILE_MODEL,
        related_name='collaborative_spaces',
        blank=True
    )
    
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='personal')
    privacy = models.CharField(max_length=20, choices=PRIVACY_CHOICES, default='private')
    accent_color = models.CharField(max_length=7, default='#00f0ff')
    
    config = models.JSONField(default=dict, blank=True, help_text="Custom configuration")
    
    is_archived = models.BooleanField(default=False)
    is_template = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['owner', '-updated_at']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.owner.username})"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Space.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
    
    def is_owner(self, user):
        """Check if user is the owner"""
        return self.owner == user
    
    def is_collaborator(self, user):
        """Check if user is a collaborator"""
        return self.collaborators.filter(id=user.id).exists()
    
    def can_edit(self, user):
        """Check if user can edit the space"""
        return self.is_owner(user) or self.is_collaborator(user)
    
    def can_view(self, user):
        """Check if user can view the space"""
        if self.privacy == 'public':
            return True
        if self.is_owner(user) or self.is_collaborator(user):
            return True
        if self.privacy == 'team':
            # Check if they're in the same organization
            # You can implement this based on your organization logic
            pass
        return False


class SpaceWidget(models.Model):
    """
    Individual widget instances within a Space.
    """
    SIZE_CHOICES = [
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='widgets')
    
    widget_type = models.CharField(max_length=100, help_text="e.g., 'code-editor', 'calendar'")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, default='medium')
    
    # Grid layout positions (for react-grid-layout)
    grid_x = models.IntegerField(default=0, help_text="Grid column position")
    grid_y = models.IntegerField(default=0, help_text="Grid row position")
    grid_w = models.IntegerField(default=4, help_text="Grid width in columns")
    grid_h = models.IntegerField(default=4, help_text="Grid height in rows")
    
    # Legacy fields (keep for backward compatibility)
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    order = models.IntegerField(default=0)
    
    config = models.JSONField(default=dict, blank=True, help_text="Widget-specific configuration")
    
    is_visible = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['space', 'order']),
            models.Index(fields=['space', 'grid_x', 'grid_y']),
        ]
    
    def __str__(self):
        return f"{self.name} in {self.space.name}"

class SpaceInvitation(models.Model):
    """
    Invitations sent to users to collaborate on a Space.
    Similar to community/repository invitation patterns.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='invitations')
    
    # Who sent the invitation (must be owner or existing collaborator)
    invited_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_space_invitations'
    )
    
    # Email of the person being invited (they might not have an account yet)
    email = models.EmailField()
    
    # If they have an account, link to their handle
    invited_user = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='received_space_invitations'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, help_text="Optional message from inviter")
    
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['space', 'email']]  # Can't invite same email twice to same space
        indexes = [
            models.Index(fields=['email', 'status']),
            models.Index(fields=['invited_user', 'status']),
        ]
    
    def __str__(self):
        return f"Invitation to {self.space.name} for {self.email}"


class SpaceActivity(models.Model):
    """
    Activity log for a Space - who did what and when.
    """
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
        ('widget_added', 'Widget Added'),
        ('widget_removed', 'Widget Removed'),
        ('widget_updated', 'Widget Updated'),
        ('collaborator_added', 'Collaborator Added'),
        ('collaborator_removed', 'Collaborator Removed'),
        ('invitation_sent', 'Invitation Sent'),
        ('invitation_accepted', 'Invitation Accepted'),
        ('privacy_changed', 'Privacy Changed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='activities')
    
    user = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='space_activities'
    )
    
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.JSONField(default=dict, blank=True, help_text="Additional details about the action")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Space Activities'
        indexes = [
            models.Index(fields=['space', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username if self.user else 'Unknown'} {self.action} in {self.space.name}"


class SpacePermission(models.Model):
    """
    Granular permissions for collaborators.
    Similar to CommunityPermission model in your codebase.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='permissions')
    user = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='space_permissions'
    )
    
    # Permissions
    can_edit_space = models.BooleanField(default=True)
    can_add_widgets = models.BooleanField(default=True)
    can_remove_widgets = models.BooleanField(default=True)
    can_invite_collaborators = models.BooleanField(default=False)
    can_remove_collaborators = models.BooleanField(default=False)
    can_change_settings = models.BooleanField(default=False)
    can_delete_space = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['space', 'user']]
        indexes = [
            models.Index(fields=['space', 'user']),
        ]
    
    def __str__(self):
        return f"Permissions for {self.user.username} in {self.space.name}"