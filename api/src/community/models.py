from django.db import models
import uuid
from ..user.models import BaseUser
from ..organization.models import Organization
import re
from django.db.models import UniqueConstraint
from django.db.models.functions import Lower
from django.core.exceptions import ValidationError


def community_banner_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'community_banners/{instance.slug}/{uuid.uuid4()}.{ext}'

def community_logo_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'community_logos/{instance.slug}/{uuid.uuid4()}.{ext}'


VISIBILITY_CHOICES = [
    ('public', 'Public'),
    ('private', 'Private'),
    ('invite', 'Invite Only'),
]

SLUG_RE = re.compile(r'^[A-Za-z0-9](?:[A-Za-z0-9_]{1,19}[A-Za-z0-9])?$')

class Community(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.CharField(
        max_length=21,
        help_text="3–21 chars: letters, digits or underscore; case-insensitive uniqueness."
    )
    description = models.TextField(blank=True, null=True)

    category = models.CharField(
        max_length=100,
        blank=True,
        default='General',
        help_text="Optional category tag for filtering/grouping (e.g., 'tech', 'education')"
    )
    type = models.CharField(max_length=100, blank=True, default="general")
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='sub_communities')
    organization = models.ForeignKey(Organization, null=True, blank=True, on_delete=models.CASCADE)

    created_by = models.ForeignKey(BaseUser, on_delete=models.CASCADE, related_name='created_communities', null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    visibility = models.CharField(
        max_length=10,
        choices=VISIBILITY_CHOICES,
        default='public'
    )
    allow_custom_tabs = models.BooleanField(default=True)
    restricted_to_org_members = models.BooleanField(default=False)

    banner = models.ImageField(upload_to=community_banner_upload_path, null=True, blank=True)
    logo = models.ImageField(upload_to=community_logo_upload_path, null=True, blank=True)

    class Meta:
        constraints = [
            # Enforce case-insensitive unique slugs
            UniqueConstraint(Lower('slug'), name='uq_community_slug_ci')
        ]

    def clean(self):
        # Validate format
        if not SLUG_RE.match(self.slug):
            raise ValidationError({
                'slug': "3–21 characters; letters, digits or underscore only; must start/end with alphanumeric."
            })

    def save(self, *args, **kwargs):
        # run clean() to enforce format
        self.full_clean()
        super().save(*args, **kwargs)


class CommunityTab(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey("Community", on_delete=models.CASCADE, related_name='tabs')
    key = models.CharField(max_length=100)  # e.g., "assignments"
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']
        unique_together = ('community', 'key')

    def __str__(self):
        return f"{self.community.name} - {self.key}"





class CommunityMembership(models.Model):
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=[
        ('admin', 'Admin'),
        ('moderator', 'Moderator'),
        ('instructor', 'Instructor'),
        ('student', 'Student'),
        ('employee', 'Employee'),
        ('member', 'Member'),
    ])
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(
        BaseUser, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='invitations_made'
    )

    class Meta:
        unique_together = ('user', 'community')




class CommunityPermission(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)

    # Each permission is a boolean toggle for specific actions
    permissions = models.JSONField(default=dict)

    class Meta:
        unique_together = ('community', 'user')
