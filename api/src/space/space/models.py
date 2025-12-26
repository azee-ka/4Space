# api/src/space/space/models.py
import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Space(models.Model):
    """
    A Space is a customizable workspace/hub that users can create for different purposes
    (personal, work, collaborative, educational, etc.)
    """
    SPACE_TYPES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
        ('collaborative', 'Collaborative'),
        ('educational', 'Educational'),
        ('creative', 'Creative'),
        ('finance', 'Finance'),
    ]

    PRIVACY_LEVELS = [
        ('private', 'Private'),
        ('team', 'Team'),
        ('public', 'Public'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True)
    definition = models.TextField(blank=True, help_text="Description/purpose of this space")
    
    # Ownership & Privacy
    owner = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL, 
        on_delete=models.CASCADE, 
        related_name='owned_spaces'
    )
    type = models.CharField(max_length=50, choices=SPACE_TYPES, default='personal')
    privacy = models.CharField(max_length=20, choices=PRIVACY_LEVELS, default='private')
    
    # Customization
    accent_color = models.CharField(max_length=7, default='#00f0ff', help_text="Hex color code")
    
    # Collaboration
    collaborators = models.ManyToManyField(
        settings.AUTH_PROFILE_MODEL, 
        related_name='collaborating_spaces', 
        blank=True
    )
    
    # Metadata
    config = models.JSONField(default=dict, blank=True, help_text="Additional configuration")
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = [['owner', 'slug']]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Space.objects.filter(owner=self.owner, slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.owner.username})"


class SpaceWidget(models.Model):
    """
    Represents a widget instance in a space
    """
    WIDGET_SIZES = [
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='widgets')
    
    # Widget identification
    widget_type = models.CharField(max_length=100, help_text="e.g., 'code-editor', 'portfolio-tracker'")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Widget configuration
    size = models.CharField(max_length=20, choices=WIDGET_SIZES, default='medium')
    config = models.JSONField(default=dict, blank=True, help_text="Widget-specific configuration")
    
    # Layout
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    order = models.IntegerField(default=0)
    
    # Metadata
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"{self.name} in {self.space.name}"


class SpaceInvitation(models.Model):
    """
    Invitations to collaborate on a space
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='invitations')
    invited_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sent_space_invitations'
    )
    invited_user = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL, 
        on_delete=models.CASCADE, 
        related_name='received_space_invitations',
        null=True,
        blank=True
    )
    email = models.EmailField(help_text="Email of invited user if not yet registered")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        recipient = self.invited_user.username if self.invited_user else self.email
        return f"Invite to {self.space.name} for {recipient}"


class SpaceActivity(models.Model):
    """
    Activity log for spaces (optional - for tracking changes)
    """
    ACTION_TYPES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('widget_added', 'Widget Added'),
        ('widget_removed', 'Widget Removed'),
        ('widget_configured', 'Widget Configured'),
        ('collaborator_added', 'Collaborator Added'),
        ('collaborator_removed', 'Collaborator Removed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Space activities'

    def __str__(self):
        return f"{self.user.username} {self.action} in {self.space.name}"