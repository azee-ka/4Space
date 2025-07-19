# space/library/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("", views.list_items),
    path("upload/", views.upload_file),
    path("folder/", views.create_folder),
    path("<uuid:item_id>/", views.get_item),
    path("<uuid:item_id>/update/", views.update_item),
    path("<uuid:item_id>/delete/", views.delete_item),
    path("<uuid:item_id>/copy/", views.copy_item),
    path("<uuid:item_id>/download/", views.download_item),
    path("<uuid:item_id>/share/", views.share_item),
    path("<uuid:item_id>/unshare/", views.unshare_item),
]
