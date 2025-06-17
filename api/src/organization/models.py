# models/organization.py
from django.db import models
from django.utils.text import slugify
from django.conf import settings

class Organization(models.Model):
    ORG_TYPE_CHOICES = [
        ('school', 'School'),
        ('company', 'Company'),
        ('research', 'Research Lab'),
        ('startup', 'Startup'),
        ('nonprofit', 'Non-Profit'),
    ]

    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    org_type = models.CharField(max_length=50, choices=ORG_TYPE_CHOICES, blank=True)

    logo = models.ImageField(upload_to='org_logos/', null=True, blank=True)
    banner = models.ImageField(upload_to='org_banners/', null=True, blank=True)

    email_domain = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional email domain (e.g., 'mit.edu') for restricting user registration."
    )
    require_domain_email = models.BooleanField(
        default=False,
        help_text="If true, only users with this domain can join automatically."
    )

    website = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)

    social_links = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON object with links like {'twitter': '...', 'linkedin': '...'}"
    )

    is_verified = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='organizations_created',
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class OrganizationMembership(models.Model):
    user = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='memberships')

    role = models.CharField(max_length=50, choices=[
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('employee', 'Employee'),
        ('member', 'Member'),
    ])

    is_approved = models.BooleanField(
        default=False,
        help_text="Indicates if this user has been approved by the organization admin."
    )
    invited_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='org_invitations'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'organization')

    def __str__(self):
        return f"{self.user.username} in {self.organization.name} as {self.role}"
