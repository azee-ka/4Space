# api/src/space/journal/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Entries
    path('<uuid:space_id>/widgets/<uuid:widget_id>/entries/', views.entries_list_create, name='journal-entries-list-create'),
    path('<uuid:space_id>/widgets/<uuid:widget_id>/entries/<uuid:entry_id>/', views.entry_detail, name='journal-entry-detail'),
    
    # Folders
    path('<uuid:space_id>/widgets/<uuid:widget_id>/folders/', views.folders_list_create, name='journal-folders-list-create'),
    path('<uuid:space_id>/widgets/<uuid:widget_id>/folders/<uuid:folder_id>/', views.folder_detail, name='journal-folder-detail'),
    
    # Tags
    path('<uuid:space_id>/widgets/<uuid:widget_id>/tags/', views.tags_list_create, name='journal-tags-list-create'),
    path('<uuid:space_id>/widgets/<uuid:widget_id>/tags/<uuid:tag_id>/', views.tag_delete, name='journal-tag-delete'),
    
    # Stats
    path('<uuid:space_id>/widgets/<uuid:widget_id>/stats/', views.get_stats, name='journal-stats'),
    
    # Bulk operations
    path('<uuid:space_id>/widgets/<uuid:widget_id>/bulk-update/', views.bulk_update, name='journal-bulk-update'),
    path('<uuid:space_id>/widgets/<uuid:widget_id>/move-entries/', views.move_entries, name='journal-move-entries'),
]