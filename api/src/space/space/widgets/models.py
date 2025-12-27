# api/src/space/widgets/models.py
# Add these models to handle widget-specific data

import uuid
from django.db import models
from django.conf import settings
from src.space.space.models import SpaceWidget


# ============================================
# JOURNAL WIDGET
# ============================================

class JournalEntry(models.Model):
    """Journal entries for the Journal widget"""
    MOOD_CHOICES = [
        ('amazing', 'Amazing'),
        ('good', 'Good'),
        ('okay', 'Okay'),
        ('bad', 'Bad'),
        ('terrible', 'Terrible'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='journal_entries')
    
    # Content
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    
    # Metadata
    date = models.DateTimeField(auto_now_add=True)
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES, null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    # Author
    author = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='journal_entries'
    )
    
    # Features
    is_starred = models.BooleanField(default=False)
    is_private = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['widget', '-date']),
            models.Index(fields=['author', '-date']),
        ]
    
    def __str__(self):
        return f"{self.title or 'Untitled'} - {self.date.strftime('%Y-%m-%d')}"


# ============================================
# PHOTO ALBUM WIDGET
# ============================================

class PhotoAlbum(models.Model):
    """Albums for organizing photos"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='albums')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    cover_photo = models.ForeignKey('Photo', null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    
    created_by = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return self.name


class Photo(models.Model):
    """Individual photos in photo album widget"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='photos')
    album = models.ForeignKey(PhotoAlbum, null=True, blank=True, on_delete=models.SET_NULL, related_name='photos')
    
    # File
    file = models.ImageField(upload_to='photos/%Y/%m/')
    thumbnail = models.ImageField(upload_to='photos/thumbs/%Y/%m/', null=True, blank=True)
    
    # Metadata
    caption = models.TextField(blank=True)
    taken_date = models.DateTimeField(null=True, blank=True)
    location = models.JSONField(null=True, blank=True)  # {lat, lng, name}
    tags = models.JSONField(default=list, blank=True)
    
    # Features
    is_starred = models.BooleanField(default=False)
    is_cover = models.BooleanField(default=False)
    
    uploaded_by = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-taken_date', '-uploaded_at']
        indexes = [
            models.Index(fields=['widget', '-uploaded_at']),
            models.Index(fields=['album', '-taken_date']),
        ]
    
    def __str__(self):
        return f"Photo {self.id} - {self.caption[:50] if self.caption else 'No caption'}"


# ============================================
# TASK MANAGER WIDGET
# ============================================

class TaskBoard(models.Model):
    """Kanban board for tasks"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='task_boards')
    
    name = models.CharField(max_length=255)
    columns = models.JSONField(default=list)  # ['To Do', 'In Progress', 'Done']
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return self.name


class Task(models.Model):
    """Individual task"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='tasks')
    board = models.ForeignKey(TaskBoard, null=True, blank=True, on_delete=models.CASCADE, related_name='tasks')
    
    # Content
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    
    # Organization
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    column = models.CharField(max_length=100, default='To Do')
    order = models.IntegerField(default=0)
    
    # Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_tasks'
    )
    
    # Dates
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Features
    tags = models.JSONField(default=list, blank=True)
    time_spent = models.IntegerField(default=0, help_text="Time spent in minutes")
    
    created_by = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE, related_name='created_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['widget', 'status']),
            models.Index(fields=['board', 'column', 'order']),
            models.Index(fields=['assigned_to', 'status']),
        ]
    
    def __str__(self):
        return self.title


class TaskComment(models.Model):
    """Comments on tasks"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    
    content = models.TextField()
    author = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment on {self.task.title} by {self.author.username}"


# ============================================
# HABIT TRACKER WIDGET
# ============================================

class Habit(models.Model):
    """Habit to track"""
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('custom', 'Custom'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='habits')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    target_days = models.JSONField(default=list, blank=True)  # ['Mon', 'Wed', 'Fri']
    color = models.CharField(max_length=7, default='#00f0ff')
    
    # Stats
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class HabitCompletion(models.Model):
    """Daily completion record for a habit"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    
    date = models.DateField()
    completed = models.BooleanField(default=True)
    note = models.TextField(blank=True)
    
    logged_by = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    logged_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['habit', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['habit', '-date']),
        ]
    
    def __str__(self):
        return f"{self.habit.name} - {self.date}"


# ============================================
# EXPENSE TRACKER WIDGET
# ============================================

class Expense(models.Model):
    """Individual expense"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='expenses')
    
    # Details
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    date = models.DateField()
    
    # Receipt
    receipt_photo = models.ImageField(upload_to='receipts/%Y/%m/', null=True, blank=True)
    
    # Payment
    paid_by = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE, related_name='expenses_paid')
    split_with = models.ManyToManyField(settings.AUTH_PROFILE_MODEL, blank=True, related_name='expenses_shared')
    
    # Features
    is_recurring = models.BooleanField(default=False)
    recurrence_period = models.CharField(max_length=20, blank=True)  # 'monthly', 'weekly'
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['widget', '-date']),
            models.Index(fields=['paid_by', '-date']),
            models.Index(fields=['category', '-date']),
        ]
    
    def __str__(self):
        return f"{self.description} - ${self.amount}"


# ============================================
# NOTES WIDGET
# ============================================

class Note(models.Model):
    """Note/document"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='notes')
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    
    # Organization
    folder = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    # Features
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    author = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-updated_at']
        indexes = [
            models.Index(fields=['widget', '-updated_at']),
            models.Index(fields=['author', '-updated_at']),
        ]
    
    def __str__(self):
        return self.title


# ============================================
# SHOPPING LIST WIDGET
# ============================================

class ShoppingList(models.Model):
    """Shopping list (groceries, household, etc)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='shopping_lists')
    
    name = models.CharField(max_length=255)
    
    created_by = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class ShoppingItem(models.Model):
    """Item in shopping list"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name='items')
    
    item = models.CharField(max_length=255)
    quantity = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=100, blank=True)
    
    is_checked = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    added_by = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['is_checked', 'order', 'added_at']
    
    def __str__(self):
        return f"{self.item} ({self.quantity})" if self.quantity else self.item