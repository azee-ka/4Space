from django.urls import path
from . import views

urlpatterns = [
    path('upload-photo/', views.upload_photo, name='upload_photo'),
    path('get-all-photos/', views.get_photos, name='get_all_photos'),
    path('create-album/', views.create_album, name='create_album'),
    path('delete-album/<uuid:album_id>/', views.delete_album, name='delete_album'),
    path('get-albums/', views.get_albums, name='get_albums'),
    path('get-album-data/<uuid:album_id>/', views.get_album_metadata, name='get_album_metadata'),
    path('get-album-photos/<uuid:album_id>/', views.get_album_photos, name='get_album_photos'),
    path('update-album-title/<uuid:album_id>/', views.update_album_title, name='update_album_title'),
    path('upload-album-photos/<uuid:album_id>/', views.upload_photos_to_album, name='upload_photos_to_album'),

]
 