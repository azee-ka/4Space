# api/src/space/journal/serializers.py

from rest_framework import serializers
from .models import (
    JournalFolder, JournalTag, JournalEntry, 
    JournalAttachment, JournalEntryComment, JournalStats
)
from src.user.serializers import MinimalUserSerializer


class JournalTagSerializer(serializers.ModelSerializer):
    """Serializer for journal tags"""
    created_by = MinimalUserSerializer(read_only=True)
    
    class Meta:
        model = JournalTag
        fields = ['id', 'name', 'color', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_at']


class JournalFolderSerializer(serializers.ModelSerializer):
    """Serializer for journal folders"""
    created_by = MinimalUserSerializer(read_only=True)
    subfolders = serializers.SerializerMethodField()
    entries_count = serializers.SerializerMethodField()
    full_path = serializers.CharField(source='get_full_path', read_only=True)
    
    class Meta:
        model = JournalFolder
        fields = [
            'id', 'name', 'description', 'color', 'icon',
            'parent', 'subfolders', 'entries_count', 'full_path',
            'order', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_subfolders(self, obj):
        """Get immediate subfolders"""
        subfolders = obj.subfolders.all()
        return JournalFolderSerializer(subfolders, many=True).data
    
    def get_entries_count(self, obj):
        """Get count of entries in this folder"""
        return obj.entries.filter(is_archived=False).count()


class JournalAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for attachments"""
    uploaded_by = MinimalUserSerializer(read_only=True)
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalAttachment
        fields = [
            'id', 'filename', 'file_type', 'file_size',
            'url', 'uploaded_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_url(self, obj):
        """Get file URL"""
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class JournalCommentSerializer(serializers.ModelSerializer):
    """Serializer for comments"""
    author = MinimalUserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntryComment
        fields = [
            'id', 'content', 'author', 'parent',
            'replies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']
    
    def get_replies(self, obj):
        """Get nested replies"""
        if obj.parent is None:  # Only get replies for top-level comments
            replies = obj.replies.all()
            return JournalCommentSerializer(replies, many=True, context=self.context).data
        return []


class JournalEntryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing entries"""
    author = MinimalUserSerializer(read_only=True)
    tags = JournalTagSerializer(many=True, read_only=True)
    folder = serializers.SerializerMethodField()
    excerpt = serializers.SerializerMethodField()
    word_count = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    attachments_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'title', 'excerpt', 'date', 'mood',
            'author', 'folder', 'tags', 'is_private',
            'is_pinned', 'is_favorite', 'is_archived',
            'word_count', 'attachments_count', 'comments_count',
            'can_edit', 'created_at', 'updated_at'
        ]
    
    def get_folder(self, obj):
        """Get minimal folder info"""
        if obj.folder:
            return {
                'id': str(obj.folder.id),
                'name': obj.folder.name,
                'color': obj.folder.color
            }
        return None
    
    def get_excerpt(self, obj):
        """Get plain text excerpt"""
        # Strip HTML tags and get first 200 chars
        import re
        text = re.sub('<[^<]+?>', '', obj.content)
        return text[:200] + '...' if len(text) > 200 else text
    
    def get_word_count(self, obj):
        """Get approximate word count"""
        import re
        text = re.sub('<[^<]+?>', '', obj.content)
        return len(text.split())
    
    def get_can_edit(self, obj):
        """Check if current user can edit"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_edit(request.user)
        return False
    
    def get_attachments_count(self, obj):
        """Get attachments count"""
        return obj.attachments.count()
    
    def get_comments_count(self, obj):
        """Get comments count"""
        return obj.comments.count()


class JournalEntryDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all details"""
    author = MinimalUserSerializer(read_only=True)
    tags = JournalTagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    folder = JournalFolderSerializer(read_only=True)
    folder_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    attachments = JournalAttachmentSerializer(many=True, read_only=True)
    comments = JournalCommentSerializer(many=True, read_only=True)
    word_count = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'title', 'content', 'date', 'mood',
            'author', 'folder', 'folder_id', 'tags', 'tag_ids',
            'is_private', 'is_pinned', 'is_favorite', 'is_archived',
            'attachments', 'comments', 'word_count',
            'can_edit', 'can_delete',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']
    
    def get_word_count(self, obj):
        """Get approximate word count"""
        import re
        text = re.sub('<[^<]+?>', '', obj.content)
        return len(text.split())
    
    def get_can_edit(self, obj):
        """Check if current user can edit"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_edit(request.user)
        return False
    
    def get_can_delete(self, obj):
        """Check if current user can delete"""
        request = self.context.get('request')
        if request and request.user:
            # Only author or space owner can delete
            return obj.author == request.user or obj.space.is_owner(request.user)
        return False
    
    def create(self, validated_data):
        """Handle tag creation"""
        tag_ids = validated_data.pop('tag_ids', [])
        folder_id = validated_data.pop('folder_id', None)
        
        # Set folder if provided
        if folder_id:
            validated_data['folder_id'] = folder_id
        
        entry = JournalEntry.objects.create(**validated_data)
        
        # Add tags
        if tag_ids:
            entry.tags.set(tag_ids)
        
        return entry
    
    def update(self, instance, validated_data):
        """Handle tag updates"""
        tag_ids = validated_data.pop('tag_ids', None)
        folder_id = validated_data.pop('folder_id', None)
        
        # Update folder if provided
        if folder_id is not None:
            if folder_id:
                instance.folder_id = folder_id
            else:
                instance.folder = None
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update tags if provided
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        
        return instance


class JournalStatsSerializer(serializers.ModelSerializer):
    """Serializer for journal statistics"""
    class Meta:
        model = JournalStats
        fields = [
            'id', 'total_entries', 'entries_this_month',
            'entries_this_week', 'current_streak', 'longest_streak',
            'avg_entries_per_week', 'most_common_mood', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class BulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk operations"""
    entry_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True
    )
    action = serializers.ChoiceField(
        choices=['archive', 'unarchive', 'delete', 'favorite', 'unfavorite', 'pin', 'unpin'],
        required=True
    )
    folder_id = serializers.UUIDField(required=False, allow_null=True)
    
    def validate_entry_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one entry ID is required")
        return value


class MoveEntriesSerializer(serializers.Serializer):
    """Serializer for moving entries to folder"""
    entry_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True
    )
    folder_id = serializers.UUIDField(required=False, allow_null=True)
    
    def validate_entry_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one entry ID is required")
        return value