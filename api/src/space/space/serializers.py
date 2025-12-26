# api/src/space/space/serializers.py

from rest_framework import serializers
from .models import Space, SpaceWidget, SpaceInvitation, SpaceActivity, SpacePermission
from src.user.serializers import MinimalUserSerializer


class SpaceWidgetSerializer(serializers.ModelSerializer):
    """Serializer for individual widgets"""
    class Meta:
        model = SpaceWidget
        fields = [
            'id', 'widget_type', 'name', 'description', 'size',
            'position_x', 'position_y', 'order', 'config',
            'is_visible', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SpacePermissionSerializer(serializers.ModelSerializer):
    """Serializer for space permissions"""
    user = MinimalUserSerializer(read_only=True)
    
    class Meta:
        model = SpacePermission
        fields = [
            'id', 'user', 'can_edit_space', 'can_add_widgets',
            'can_remove_widgets', 'can_invite_collaborators',
            'can_remove_collaborators', 'can_change_settings',
            'can_delete_space'
        ]


class SpaceInvitationSerializer(serializers.ModelSerializer):
    """Serializer for space invitations"""
    invited_by = MinimalUserSerializer(read_only=True)
    invited_user = MinimalUserSerializer(read_only=True)
    space_name = serializers.CharField(source='space.name', read_only=True)
    space_id = serializers.UUIDField(source='space.id', read_only=True)
    message = serializers.CharField(required=False, allow_blank=True, default='')
    
    class Meta:
        model = SpaceInvitation
        fields = [
            'id', 'space', 'space_name', 'space_id',
            'invited_by', 'email', 'invited_user',
            'status', 'message', 'created_at', 'responded_at'
        ]
        read_only_fields = ['id', 'invited_by', 'created_at', 'responded_at']


class SpaceActivitySerializer(serializers.ModelSerializer):
    """Serializer for space activity log"""
    user = MinimalUserSerializer(read_only=True)
    
    class Meta:
        model = SpaceActivity
        fields = ['id', 'action', 'user', 'details', 'created_at']
        read_only_fields = ['id', 'created_at']


class SpaceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing spaces"""
    owner = MinimalUserSerializer(read_only=True)
    collaborators = MinimalUserSerializer(many=True, read_only=True)  # ✅ FIXED: Return actual collaborator data
    widgets_count = serializers.SerializerMethodField()
    collaborators_count = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    is_collaborator = serializers.SerializerMethodField()
    
    class Meta:
        model = Space
        fields = [
            'id', 'name', 'slug', 'definition', 'type', 'privacy',
            'accent_color', 'owner', 'collaborators', 'widgets_count', 
            'collaborators_count', 'is_owner', 'is_collaborator', 
            'is_archived', 'created_at', 'updated_at'
        ]
    
    def get_widgets_count(self, obj):
        return obj.widgets.filter(is_visible=True).count()
    
    def get_collaborators_count(self, obj):
        return obj.collaborators.count()
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.is_owner(request.user)
        return False
    
    def get_is_collaborator(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.is_collaborator(request.user)
        return False


class SpaceDetailSerializer(serializers.ModelSerializer):
    """Full serializer with nested widgets and collaborators"""
    owner = MinimalUserSerializer(read_only=True)
    widgets = SpaceWidgetSerializer(many=True, read_only=True)
    collaborators = MinimalUserSerializer(many=True, read_only=True)
    is_owner = serializers.SerializerMethodField()
    is_collaborator = serializers.SerializerMethodField()
    user_permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = Space
        fields = [
            'id', 'name', 'slug', 'definition', 'type', 'privacy',
            'accent_color', 'config', 'owner', 'widgets', 'collaborators',
            'is_owner', 'is_collaborator', 'user_permissions',
            'is_archived', 'is_template', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'owner', 'created_at', 'updated_at']
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.is_owner(request.user)
        return False
    
    def get_is_collaborator(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.is_collaborator(request.user)
        return False
    
    def get_user_permissions(self, obj):
        """Get current user's permissions for this space"""
        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        # Owner has all permissions
        if obj.is_owner(request.user):
            return {
                'can_edit_space': True,
                'can_add_widgets': True,
                'can_remove_widgets': True,
                'can_invite_collaborators': True,
                'can_remove_collaborators': True,
                'can_change_settings': True,
                'can_delete_space': True,
            }
        
        # Check for custom permissions
        try:
            perm = SpacePermission.objects.get(space=obj, user=request.user)
            return SpacePermissionSerializer(perm).data
        except SpacePermission.DoesNotExist:
            # Default collaborator permissions
            if obj.is_collaborator(request.user):
                return {
                    'can_edit_space': True,
                    'can_add_widgets': True,
                    'can_remove_widgets': True,
                    'can_invite_collaborators': False,
                    'can_remove_collaborators': False,
                    'can_change_settings': False,
                    'can_delete_space': False,
                }
            return None


class SpaceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating spaces"""
    
    class Meta:
        model = Space
        fields = [
            'name', 'definition', 'type', 'privacy',
            'accent_color', 'config', 'is_archived'
        ]
    
    def create(self, validated_data):
        # Set owner to the current user
        request = self.context.get('request')
        validated_data['owner'] = request.user
        return super().create(validated_data)
    
    def validate_name(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Space name cannot be empty")
        if len(value) > 255:
            raise serializers.ValidationError("Space name too long")
        return value.strip()
    
    def validate_accent_color(self, value):
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError("Invalid color format. Use #RRGGBB")
        return value


class InviteCollaboratorSerializer(serializers.Serializer):
    """Serializer for inviting collaborators"""
    email = serializers.EmailField(required=True)
    message = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_email(self, value):
        return value.lower().strip()


class UpdatePermissionsSerializer(serializers.Serializer):
    """Serializer for updating collaborator permissions"""
    user_id = serializers.UUIDField(required=True)
    permissions = serializers.DictField(required=True)
    
    def validate_permissions(self, value):
        allowed_keys = {
            'can_edit_space', 'can_add_widgets', 'can_remove_widgets',
            'can_invite_collaborators', 'can_remove_collaborators',
            'can_change_settings', 'can_delete_space'
        }
        
        # Check for invalid keys
        invalid_keys = set(value.keys()) - allowed_keys
        if invalid_keys:
            raise serializers.ValidationError(f"Invalid permission keys: {invalid_keys}")
        
        # Check for invalid values
        for key, val in value.items():
            if not isinstance(val, bool):
                raise serializers.ValidationError(f"{key} must be a boolean")
        
        return value