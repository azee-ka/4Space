# api/src/space/journal/models.py

import uuid
from django.db import models
from django.conf import settings
from src.space.space.models import Space, SpaceWidget


class JournalFolder(models.Model):
    """
    Folders for organizing journal entries (like Google Drive folders).
    Each space has its own folder structure.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='journal_folders')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3b82f6')  # Folder color
    icon = models.CharField(max_length=50, default='folder', help_text="Icon name/emoji")
    
    # Nested folders support
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='subfolders'
    )
    
    # Owner/creator
    created_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_journal_folders'
    )
    
    # Ordering
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['space', 'parent']),
            models.Index(fields=['space', 'order']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.space.name})"
    
    def get_full_path(self):
        """Get full path like 'Folder1/Folder2/Current'"""
        if self.parent:
            return f"{self.parent.get_full_path()}/{self.name}"
        return self.name


class JournalTag(models.Model):
    """
    Tags for categorizing journal entries.
    Space-specific to avoid tag pollution across spaces.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='journal_tags')
    
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#6b7280')
    
    created_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_journal_tags'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        unique_together = [['space', 'name']]  # Tag names unique within a space
        indexes = [
            models.Index(fields=['space', 'name']),
        ]
    
    def __str__(self):
        return f"#{self.name} ({self.space.name})"


class JournalEntry(models.Model):
    """
    Individual journal entry.
    """
    MOOD_CHOICES = [
        ('amazing', 'Amazing'),
        ('good', 'Good'),
        ('okay', 'Okay'),
        ('bad', 'Bad'),
        ('terrible', 'Terrible'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='journal_entries')
    folder = models.ForeignKey(
        JournalFolder, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='entries'
    )
    
    # Content
    title = models.CharField(max_length=500, blank=True)
    content = models.TextField(blank=True, help_text="Rich text HTML content")
    
    # Metadata
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES, null=True, blank=True)
    date = models.DateField(help_text="Entry date (can be different from created_at)")
    
    # Tags (many-to-many)
    tags = models.ManyToManyField(JournalTag, blank=True, related_name='entries')
    
    # Author
    author = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='journal_entries'
    )
    
    # Privacy (within the space)
    is_private = models.BooleanField(
        default=False,
        help_text="If true, only author can see this entry even in shared space"
    )
    
    # Pinning
    is_pinned = models.BooleanField(default=False)
    
    # Favorites/stars
    is_favorite = models.BooleanField(default=False)
    
    # Archive
    is_archived = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name_plural = 'Journal Entries'
        indexes = [
            models.Index(fields=['space', '-date']),
            models.Index(fields=['space', 'author', '-date']),
            models.Index(fields=['space', 'folder', '-date']),
            models.Index(fields=['space', 'is_archived', '-date']),
            models.Index(fields=['author', '-date']),
        ]
    
    def __str__(self):
        return f"{self.title or 'Untitled'} - {self.date}"
    
    def can_view(self, user):
        """Check if user can view this entry"""
        # Author can always view
        if self.author == user:
            return True
        
        # Private entries only visible to author
        if self.is_private:
            return False
        
        # Check space access
        return self.space.can_view(user)
    
    def can_edit(self, user):
        """Check if user can edit this entry"""
        # Only author can edit (or space owner for moderation)
        return self.author == user or self.space.is_owner(user)


class JournalAttachment(models.Model):
    """
    Attachments for journal entries (images, files, etc.)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='attachments')
    
    file = models.FileField(upload_to='journal_attachments/%Y/%m/')
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)  # MIME type
    file_size = models.IntegerField(help_text="Size in bytes")
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.filename} ({self.entry.title})"


class JournalEntryComment(models.Model):
    """
    Comments on journal entries for collaboration.
    Only available in shared spaces.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='comments')
    
    author = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='journal_comments'
    )
    
    content = models.TextField()
    
    # Reply support
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.entry.title}"


class JournalStats(models.Model):
    """
    Cached statistics for journal widgets.
    Updated periodically or on entry creation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.OneToOneField(
        SpaceWidget,
        on_delete=models.CASCADE,
        related_name='journal_stats'
    )
    
    # Stats
    total_entries = models.IntegerField(default=0)
    entries_this_month = models.IntegerField(default=0)
    entries_this_week = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    avg_entries_per_week = models.FloatField(default=0.0)
    
    # Most common mood
    most_common_mood = models.CharField(max_length=20, null=True, blank=True)
    
    # Last update
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Journal Stats'
    
    def __str__(self):
        return f"Stats for {self.widget.name}"