# api/src/space/space/admin.py

from django.contrib import admin
from .models import Space, SpaceWidget, SpaceInvitation, SpaceActivity, SpacePermission


@admin.register(Space)
class SpaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'type', 'privacy', 'created_at', 'is_archived']
    list_filter = ['type', 'privacy', 'is_archived', 'created_at']
    search_fields = ['name', 'owner__username', 'slug']
    readonly_fields = ['id', 'slug', 'created_at', 'updated_at']
    filter_horizontal = ['collaborators']
    
    fieldsets = [
        ('Basic Info', {
            'fields': ['id', 'name', 'slug', 'definition', 'owner']
        }),
        ('Settings', {
            'fields': ['type', 'privacy', 'accent_color', 'config']
        }),
        ('Collaborators', {
            'fields': ['collaborators']
        }),
        ('Status', {
            'fields': ['is_archived', 'is_template']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at']
        }),
    ]


@admin.register(SpaceWidget)
class SpaceWidgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'space', 'widget_type', 'size', 'order', 'is_visible']
    list_filter = ['widget_type', 'size', 'is_visible']
    search_fields = ['name', 'space__name', 'widget_type']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = [
        ('Basic Info', {
            'fields': ['id', 'space', 'widget_type', 'name', 'description']
        }),
        ('Layout', {
            'fields': ['size', 'position_x', 'position_y', 'order']
        }),
        ('Configuration', {
            'fields': ['config', 'is_visible']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at']
        }),
    ]


@admin.register(SpaceInvitation)
class SpaceInvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'space', 'invited_by', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['email', 'space__name', 'invited_by__username']
    readonly_fields = ['id', 'created_at', 'responded_at']
    
    fieldsets = [
        ('Invitation Info', {
            'fields': ['id', 'space', 'email', 'invited_by', 'invited_user']
        }),
        ('Status', {
            'fields': ['status', 'message']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'responded_at']
        }),
    ]


@admin.register(SpaceActivity)
class SpaceActivityAdmin(admin.ModelAdmin):
    list_display = ['space', 'user', 'action', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['space__name', 'user__username']
    readonly_fields = ['id', 'created_at']
    
    fieldsets = [
        ('Activity Info', {
            'fields': ['id', 'space', 'user', 'action', 'details']
        }),
        ('Timestamp', {
            'fields': ['created_at']
        }),
    ]


@admin.register(SpacePermission)
class SpacePermissionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'space',
        'can_edit_space', 'can_add_widgets', 'can_invite_collaborators'
    ]
    list_filter = [
        'can_edit_space', 'can_add_widgets', 'can_remove_widgets',
        'can_invite_collaborators', 'can_delete_space'
    ]
    search_fields = ['user__username', 'space__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = [
        ('Basic Info', {
            'fields': ['id', 'space', 'user']
        }),
        ('Permissions', {
            'fields': [
                'can_edit_space', 'can_add_widgets', 'can_remove_widgets',
                'can_invite_collaborators', 'can_remove_collaborators',
                'can_change_settings', 'can_delete_space'
            ]
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at']
        }),
    ]