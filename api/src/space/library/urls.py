# space/library/urls.py
from django.urls import path, include
from . import views

urlpatterns = [
    path("", views.library_items),
    path("upload/", views.upload_library_file),
    path("folder/", views.create_library_folder),
    path("folder/<uuid:folder_id>/", views.get_folder_detail),
]
    
    # path("items/<uuid:item_id>/", views.library_item_detail),
    # path("items/<uuid:item_id>/download/", views.download_library_item),
    # path("items/<uuid:item_id>/preview/", views.preview_library_item),
    # path("items/<uuid:item_id>/share/", views.share_library_item),
    # path("items/<uuid:item_id>/unshare/", views.unshare_library_item),
    # path("items/<uuid:item_id>/delete/", views.delete_library_item),
    # path("items/<uuid:item_id>/update/", views.update_library_item),
    # path("items/<uuid:item_id>/copy/", views.copy_library_item),
    # path("items/<uuid:item_id>/move/", views.move_library_item),

