# api/src/space/space/serializers.py
from rest_framework import serializers
from .models import Space, SpaceWidget, SpaceInvitation, SpaceActivity


class SpaceWidgetSerializer(serializers.ModelSerializer):
    """Serializer for SpaceWidget model"""
    
    class Meta:
        model = SpaceWidget
        fields = [
            'id', 'widget_type', 'name', 'description', 'size',
            'config', 'position_x', 'position_y', 'order',
            'is_pinned', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SpaceSerializer(serializers.ModelSerializer):
    """Serializer for Space model with nested widgets"""
    widgets = SpaceWidgetSerializer(many=True, read_only=True)
    collaborators = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Space
        fields = [
            'id', 'name', 'slug', 'definition', 'owner', 'type',
            'privacy', 'accent_color', 'collaborators', 'config',
            'is_archived', 'widgets', 'is_owner', 'can_edit',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'owner', 'created_at', 'updated_at']

    def get_collaborators(self, obj):
        """Return list of collaborator usernames/emails"""
        return [
            {
                'id': str(collab.id),
                'username': collab.username,
                'email': collab.email,
            }
            for collab in obj.collaborators.all()
        ]

    def get_is_owner(self, obj):
        """Check if current user is the owner"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.owner == request.user
        return False

    def get_can_edit(self, obj):
        """Check if current user can edit this space"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return (
                obj.owner == request.user or
                obj.collaborators.filter(id=request.user.id).exists()
            )
        return False


class SpaceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing spaces (without widgets)"""
    widget_count = serializers.SerializerMethodField()
    collaborator_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Space
        fields = [
            'id', 'name', 'slug', 'definition', 'type', 'privacy',
            'accent_color', 'widget_count', 'collaborator_count',
            'is_archived', 'updated_at'
        ]

    def get_widget_count(self, obj):
        return obj.widgets.count()

    def get_collaborator_count(self, obj):
        return obj.collaborators.count()


class SpaceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating spaces"""
    
    class Meta:
        model = Space
        fields = [
            'name', 'definition', 'type', 'privacy', 'accent_color', 'config'
        ]

    def create(self, validated_data):
        """Set the owner to the current user"""
        request = self.context.get('request')
        validated_data['owner'] = request.user
        return super().create(validated_data)


class SpaceInvitationSerializer(serializers.ModelSerializer):
    """Serializer for space invitations"""
    space_name = serializers.CharField(source='space.name', read_only=True)
    invited_by_username = serializers.CharField(source='invited_by.username', read_only=True)
    
    class Meta:
        model = SpaceInvitation
        fields = [
            'id', 'space', 'space_name', 'invited_by', 'invited_by_username',
            'email', 'status', 'created_at', 'responded_at'
        ]
        read_only_fields = ['id', 'invited_by', 'status', 'created_at', 'responded_at']


class SpaceActivitySerializer(serializers.ModelSerializer):
    """Serializer for space activity log"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = SpaceActivity
        fields = [
            'id', 'action', 'user', 'user_username', 'details', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']