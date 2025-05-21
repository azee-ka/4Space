from django.db import models
import uuid
from ..user.models import BaseUser
from ..organization.models import Organization


def community_banner_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'community_banners/{instance.slug}/{uuid.uuid4()}.{ext}'

def community_logo_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'community_logos/{instance.slug}/{uuid.uuid4()}.{ext}'


class CommunityType(models.Model):
    key = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=100, blank=True)



class TabDefinition(models.Model):
    key = models.CharField(max_length=100, unique=True)  # e.g. "assignments", "funding", "resources"
    label = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    is_custom_allowed = models.BooleanField(default=True)
    config_schema = models.JSONField(default=dict, blank=True)

    category = models.CharField(
        max_length=100,
        blank=True,
        help_text="Category grouping for organizational purposes (e.g., 'school', 'startup')"
    )



class Community(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)

    category = models.CharField(
        max_length=100,
        blank=True,
        default='General',
        help_text="Optional category tag for filtering/grouping (e.g., 'tech', 'education')"
    )
    type = models.ForeignKey(CommunityType, null=True, on_delete=models.SET_NULL)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='sub_communities')
    organization = models.ForeignKey(Organization, null=True, blank=True, on_delete=models.CASCADE)

    created_by = models.ForeignKey(BaseUser, on_delete=models.CASCADE, related_name='created_communities', null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    is_public = models.BooleanField(default=True)
    allow_custom_tabs = models.BooleanField(default=True)
    restricted_to_org_members = models.BooleanField(default=False)

    banner = models.ImageField(upload_to=community_banner_upload_path, null=True, blank=True)
    logo = models.ImageField(upload_to=community_logo_upload_path, null=True, blank=True)




class CommunityTab(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='tabs')
    tab_definition = models.ForeignKey(TabDefinition, on_delete=models.CASCADE, null=True, blank=True)
    custom_label = models.CharField(max_length=100, blank=True)
    order = models.PositiveIntegerField(default=0)
    config = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    # 🆕 Privacy Roles
    viewable_by_roles = models.JSONField(default=list, blank=True)
    editable_by_roles = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['order']
        unique_together = ('community', 'tab_definition')




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
