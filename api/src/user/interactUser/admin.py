from django.contrib import admin
from ..interactUser.models import InteractUser

@admin.register(InteractUser)
class InteractUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'display_name', 'first_name', 'last_name')
