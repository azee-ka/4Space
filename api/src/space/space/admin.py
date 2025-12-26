# api/src/space/space/admin.py
from django.contrib import admin
from .models import Space, SpaceWidget, SpaceInvitation, SpaceActivity


@admin.register(Space)
class SpaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'type', 'privacy', 'created_at', 'is_archived']
    list_filter = ['type', 'privacy', 'is_archived', 'created_at']
    search_fields = ['name', 'owner__username', 'owner__email']
    readonly_fields = ['id', 'slug', 'created_at', 'updated_at']
    filter_horizontal = ['collaborators']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'slug', 'definition', 'owner')
        }),
        ('Settings', {
            'fields': ('type', 'privacy', 'accent_color', 'config')
        }),
        ('Collaboration', {
            'fields': ('collaborators',)
        }),
        ('Status', {
            'fields': ('is_archived', 'created_at', 'updated_at')
        }),
    )


@admin.register(SpaceWidget)
class SpaceWidgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'space', 'widget_type', 'size', 'order', 'is_pinned']
    list_filter = ['widget_type', 'size', 'is_pinned', 'created_at']
    search_fields = ['name', 'space__name', 'widget_type']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'space', 'widget_type', 'name', 'description')
        }),
        ('Configuration', {
            'fields': ('size', 'config', 'position_x', 'position_y', 'order', 'is_pinned')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(SpaceInvitation)
class SpaceInvitationAdmin(admin.ModelAdmin):
    list_display = ['space', 'email', 'invited_by', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['email', 'space__name', 'invited_by__username']
    readonly_fields = ['id', 'created_at', 'responded_at']


@admin.register(SpaceActivity)
class SpaceActivityAdmin(admin.ModelAdmin):
    list_display = ['space', 'user', 'action', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['space__name', 'user__username']
    readonly_fields = ['id', 'created_at']