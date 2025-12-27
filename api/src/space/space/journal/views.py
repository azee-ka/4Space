# api/src/space/journal/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta
from src.space.space.models import Space, SpaceWidget
from .models import (
    JournalEntry, JournalFolder, JournalTag,
    JournalAttachment, JournalEntryComment, JournalStats
)
from .serializers import (
    JournalEntryListSerializer, JournalEntryDetailSerializer,
    JournalFolderSerializer, JournalTagSerializer,
    JournalAttachmentSerializer, JournalCommentSerializer,
    JournalStatsSerializer, BulkUpdateSerializer, MoveEntriesSerializer
)


# ============================================
# ENTRIES
# ============================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def entries_list_create(request, space_id, widget_id):
    """
    GET: List journal entries for a space/widget
    POST: Create a new journal entry
    """
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if not space.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this space."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        # Get query params
        folder_id = request.GET.get('folder')
        tag_id = request.GET.get('tag')
        mood = request.GET.get('mood')
        search = request.GET.get('search')
        is_favorite = request.GET.get('favorite')
        is_archived = request.GET.get('archived', 'false').lower() == 'true'
        author_id = request.GET.get('author')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        # Base query
        entries = JournalEntry.objects.filter(space=space)
        
        # Filter by visibility
        if not space.is_owner(request.user) and not space.is_collaborator(request.user):
            entries = entries.filter(is_private=False)
        else:
            # Show own entries + non-private entries
            entries = entries.filter(
                Q(author=request.user) | Q(is_private=False)
            )
        
        # Apply filters
        if folder_id:
            entries = entries.filter(folder_id=folder_id)
        
        if tag_id:
            entries = entries.filter(tags__id=tag_id)
        
        if mood:
            entries = entries.filter(mood=mood)
        
        if is_favorite:
            entries = entries.filter(is_favorite=True, author=request.user)
        
        entries = entries.filter(is_archived=is_archived)
        
        if author_id:
            entries = entries.filter(author_id=author_id)
        
        if date_from:
            try:
                entries = entries.filter(date__gte=datetime.fromisoformat(date_from).date())
            except:
                pass
        
        if date_to:
            try:
                entries = entries.filter(date__lte=datetime.fromisoformat(date_to).date())
            except:
                pass
        
        if search:
            entries = entries.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search)
            )
        
        entries = entries.distinct().select_related('author', 'folder').prefetch_related('tags')
        
        serializer = JournalEntryListSerializer(entries, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not space.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to create entries."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JournalEntryDetailSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            entry = serializer.save(
                space=space,
                author=request.user
            )
            
            # Update stats
            update_journal_stats(widget)
            
            return Response(
                JournalEntryDetailSerializer(entry, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def entry_detail(request, space_id, widget_id, entry_id):
    """
    GET: Retrieve entry details
    PATCH: Update entry
    DELETE: Delete entry
    """
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    entry = get_object_or_404(JournalEntry, id=entry_id, space=space)
    
    # Check view permission
    if not entry.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this entry."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        serializer = JournalEntryDetailSerializer(entry, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        if not entry.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to edit this entry."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JournalEntryDetailSerializer(
            entry,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            updated_entry = serializer.save()
            
            # Update stats if needed
            if 'is_archived' in request.data or 'date' in request.data:
                update_journal_stats(widget)
            
            return Response(
                JournalEntryDetailSerializer(updated_entry, context={'request': request}).data
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if entry.author != request.user and not space.is_owner(request.user):
            return Response(
                {"detail": "Only the author or space owner can delete this entry."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        entry.delete()
        
        # Update stats
        update_journal_stats(widget)
        
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================
# FOLDERS
# ============================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def folders_list_create(request, space_id, widget_id):
    """
    GET: List folders
    POST: Create folder
    """
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if not space.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this space."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        # Get root folders (no parent)
        folders = JournalFolder.objects.filter(space=space, parent=None)
        serializer = JournalFolderSerializer(folders, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not space.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to create folders."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JournalFolderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            folder = serializer.save(
                space=space,
                created_by=request.user
            )
            return Response(
                JournalFolderSerializer(folder, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def folder_detail(request, space_id, widget_id, folder_id):
    """
    GET: Get folder details
    PATCH: Update folder
    DELETE: Delete folder
    """
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    folder = get_object_or_404(JournalFolder, id=folder_id, space=space)
    
    if not space.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this space."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        serializer = JournalFolderSerializer(folder, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        if not space.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to edit folders."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JournalFolderSerializer(
            folder,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            updated_folder = serializer.save()
            return Response(
                JournalFolderSerializer(updated_folder, context={'request': request}).data
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not space.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to delete folders."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if folder has entries
        if folder.entries.exists():
            return Response(
                {"detail": "Cannot delete folder with entries. Move or delete entries first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if folder has subfolders
        if folder.subfolders.exists():
            return Response(
                {"detail": "Cannot delete folder with subfolders. Delete subfolders first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        folder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================
# TAGS
# ============================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tags_list_create(request, space_id, widget_id):
    """
    GET: List tags
    POST: Create tag
    """
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if not space.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this space."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        tags = JournalTag.objects.filter(space=space)
        serializer = JournalTagSerializer(tags, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not space.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to create tags."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JournalTagSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            tag = serializer.save(
                space=space,
                created_by=request.user
            )
            return Response(
                JournalTagSerializer(tag, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def tag_delete(request, space_id, widget_id, tag_id):
    """Delete tag"""
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    tag = get_object_or_404(JournalTag, id=tag_id, space=space)
    
    if not space.can_edit(request.user):
        return Response(
            {"detail": "You do not have permission to delete tags."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    tag.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================
# STATS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stats(request, space_id, widget_id):
    """Get journal statistics"""
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if not space.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this space."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get or create stats
    stats, created = JournalStats.objects.get_or_create(widget=widget)
    
    # Update if stale (older than 1 hour)
    if created or (timezone.now() - stats.updated_at).seconds > 3600:
        update_journal_stats(widget)
        stats.refresh_from_db()
    
    serializer = JournalStatsSerializer(stats)
    return Response(serializer.data)


# ============================================
# BULK OPERATIONS
# ============================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_update(request, space_id, widget_id):
    """
    Bulk operations on entries
    """
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if not space.can_edit(request.user):
        return Response(
            {"detail": "You do not have permission to edit entries."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = BulkUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    entry_ids = serializer.validated_data['entry_ids']
    action = serializer.validated_data['action']
    folder_id = serializer.validated_data.get('folder_id')
    
    # Get entries (only ones user can edit)
    entries = JournalEntry.objects.filter(
        id__in=entry_ids,
        space=space,
        author=request.user
    )
    
    with transaction.atomic():
        if action == 'archive':
            entries.update(is_archived=True)
        elif action == 'unarchive':
            entries.update(is_archived=False)
        elif action == 'delete':
            entries.delete()
        elif action == 'favorite':
            entries.update(is_favorite=True)
        elif action == 'unfavorite':
            entries.update(is_favorite=False)
        elif action == 'pin':
            entries.update(is_pinned=True)
        elif action == 'unpin':
            entries.update(is_pinned=False)
    
    # Update stats
    if action in ['archive', 'unarchive', 'delete']:
        update_journal_stats(widget)
    
    return Response(
        {"detail": f"Successfully {action}d {entries.count()} entries"},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def move_entries(request, space_id, widget_id):
    """Move entries to a folder"""
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if not space.can_edit(request.user):
        return Response(
            {"detail": "You do not have permission to move entries."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = MoveEntriesSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    entry_ids = serializer.validated_data['entry_ids']
    folder_id = serializer.validated_data.get('folder_id')
    
    # Verify folder belongs to space
    if folder_id:
        folder = get_object_or_404(JournalFolder, id=folder_id, space=space)
    else:
        folder = None
    
    # Get entries (only ones user can edit)
    entries = JournalEntry.objects.filter(
        id__in=entry_ids,
        space=space,
        author=request.user
    )
    
    entries.update(folder=folder)
    
    return Response(
        {"detail": f"Successfully moved {entries.count()} entries"},
        status=status.HTTP_200_OK
    )


# ============================================
# HELPER FUNCTIONS
# ============================================

def update_journal_stats(widget):
    """Update statistics for a journal widget"""
    space = widget.space
    
    # Get all non-archived entries
    all_entries = JournalEntry.objects.filter(
        space=space,
        is_archived=False
    )
    
    # Calculate stats
    total = all_entries.count()
    
    now = timezone.now()
    this_month = all_entries.filter(
        date__year=now.year,
        date__month=now.month
    ).count()
    
    week_ago = now.date() - timedelta(days=7)
    this_week = all_entries.filter(date__gte=week_ago).count()
    
    # Calculate streak
    streak = calculate_streak(all_entries)
    
    # Most common mood
    mood_counts = all_entries.filter(mood__isnull=False).values('mood').annotate(
        count=Count('mood')
    ).order_by('-count')
    most_common = mood_counts.first()['mood'] if mood_counts else None
    
    # Average per week (last 12 weeks)
    twelve_weeks_ago = now.date() - timedelta(weeks=12)
    recent_entries = all_entries.filter(date__gte=twelve_weeks_ago).count()
    avg_per_week = round(recent_entries / 12, 1) if recent_entries > 0 else 0
    
    # Update or create stats
    stats, created = JournalStats.objects.get_or_create(widget=widget)
    stats.total_entries = total
    stats.entries_this_month = this_month
    stats.entries_this_week = this_week
    stats.current_streak = streak['current']
    stats.longest_streak = streak['longest']
    stats.avg_entries_per_week = avg_per_week
    stats.most_common_mood = most_common
    stats.save()


def calculate_streak(entries):
    """Calculate current and longest streak"""
    if not entries.exists():
        return {'current': 0, 'longest': 0}
    
    # Get all dates sorted
    dates = list(entries.values_list('date', flat=True).distinct().order_by('-date'))
    
    if not dates:
        return {'current': 0, 'longest': 0}
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    today = timezone.now().date()
    
    # Check current streak
    expected_date = today
    for date in dates:
        if date == expected_date or date == expected_date - timedelta(days=1):
            current_streak += 1
            expected_date = date - timedelta(days=1)
        else:
            break
    
    # Calculate longest streak
    prev_date = None
    for date in sorted(dates):
        if prev_date is None:
            temp_streak = 1
        elif (date - prev_date).days == 1:
            temp_streak += 1
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 1
        prev_date = date
    
    longest_streak = max(longest_streak, temp_streak)
    
    return {
        'current': current_streak,
        'longest': longest_streak
    }