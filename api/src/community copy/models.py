from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
import uuid
from src.user.models import BaseUser


CATEGORY_CHOICES = [
    ('education', 'Education'),
    ('research', 'Research & Science'),
    ('technology', 'Technology'),
    ('creative', 'Creative & Arts'),
    ('business', 'Business & Startups'),
    ('enterprise', 'Corporate / Enterprise'),
    ('nonprofit', 'Nonprofit'),
    ('civic', 'Civic & Government'),
    ('healthcare', 'Healthcare'),
    ('general', 'General / Social'),
    ('utility', 'Utility / Experimental'),
]


TAB_TYPE_CHOICES = [
    # Core & Social
    ('discussion', 'Discussion Board'),
    ('custom', 'Custom Page (Markdown)'),
    ('dashboard', 'Custom Dashboard'),
    ('events', 'Events Calendar'),
    
    # Education
    ('assignments', 'Assignments'),
    ('grades', 'Grades'),
    ('roster', 'Class Roster'),
    ('notebook', 'Notebook'),
    ('resources', 'Resources / Files'),

    # Research
    ('experiments', 'Experiments Tracker'),
    ('data_vault', 'Data Vault'),
    ('publications', 'Publications'),
    ('whitepaper', 'Whitepapers'),

    # Business/Startups
    ('funding', 'Funding Board'),
    ('investors', 'Investor Relations'),
    ('pitch_deck', 'Pitch Deck Viewer'),
    ('projects', 'Project Management'),
    ('tasks', 'Task Manager'),

    # Enterprise
    ('timecard', 'Timecard / Work Hours'),
    ('team', 'Employee Directory'),
    ('onboarding', 'New Hire Docs'),
    ('internal_policies', 'Company Policies'),

    # Nonprofits
    ('donations', 'Donation Tracker'),
    ('volunteers', 'Volunteer Directory'),
    ('impact', 'Impact Reports'),

    # Civic
    ('voting', 'Voting & Polls'),
    ('civic_issues', 'Policy Proposals'),
    ('community_projects', 'Civic Projects'),

    # Healthcare
    ('shifts', 'Shift Schedule'),
    ('patients', 'Patient Records'),
    ('care_notes', 'Care Notes'),

    # Creative
    ('gallery', 'Art Gallery'),
    ('storyboard', 'Storyboards'),
    ('media_library', 'Media Library'),

    # General
    ('bookmarks', 'Bookmarks'),
    ('book_club', 'Book Club Tracker'),
    ('language_exchange', 'Language Exchange'),

    # Utility
    ('admin_panel', 'Admin Panel'),
    ('debug_log', 'Debug Console'),
    ('analytics', 'Usage Analytics'),
]


    # tab_type = models.CharField(max_length=50, choices=[
    #     ('discussion', 'Discussion Board'),
    #     ('projects', 'Project Management'),
    #     ('events', 'Events Calendar'),
    #     ('library', 'Research/Files Library'),
    #     ('funding', 'Funding Board'),
    #     ('assignments', 'Assignments'),
    #     ('grades', 'Grades'),
    #     ('custom', 'Custom/Markdown Page'),
    #     ('tasks', 'To-Do Manager'),
    #     ('notebook', 'Notebook'),
    #     ('whitepaper', 'Whitepapers'),
    #     ('resources', 'Resources Database'),
    # ])


class CommunityTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text="Optional: FontAwesome icon name or emoji")
    
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    suggested_tabs = models.JSONField(default=list, blank=True)
    
    custom_fields_schema = models.JSONField(default=dict, blank=True)

    # Control Access for Templates (Optional)
    is_default = models.BooleanField(default=False)  # Default visible for new users
    allow_public_creation = models.BooleanField(default=True)  # Only admin-only templates if False

    def __str__(self):
        return self.name


class Community(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Identity
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)

    # Ownership
    creator = models.ForeignKey(BaseUser, related_name='created_communities', on_delete=models.CASCADE)
    admins = models.ManyToManyField(BaseUser, related_name='admin_communities', blank=True)

    # Visuals
    logo = models.ImageField(upload_to='community_logos/', blank=True, null=True)
    banner_image = models.ImageField(upload_to='community_banners/', blank=True, null=True)
    theme_color = models.CharField(max_length=20, blank=True, null=True, help_text="Hex color code")

    # Visibility
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private (invite only)'),
        ('hidden', 'Hidden (link-only)'),
    ]
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')

    # Type/Template
    template = models.ForeignKey(CommunityTemplate, null=True, blank=True, on_delete=models.SET_NULL)

    # Dynamic Fields Storage
    custom_fields_data = models.JSONField(default=dict, blank=True)

    # Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    archived = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            unique_slug = base_slug
            num = 1
            while Community.objects.filter(slug=unique_slug).exists():
                unique_slug = f"{base_slug}-{num}"
                num += 1
            self.slug = unique_slug
        super().save(*args, **kwargs)


class CommunityTab(models.Model):
    community = models.ForeignKey(Community, related_name='tabs', on_delete=models.CASCADE)
    
    name = models.CharField(max_length=100)
    tab_type = models.CharField(max_length=50, choices=TAB_TYPE_CHOICES)
    
    
    settings = models.JSONField(default=dict, blank=True)  # Optional, customizable per tab
    
    ordering = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['ordering', 'created_at']

    def __str__(self):
        return f"{self.name} ({self.community.name})"
