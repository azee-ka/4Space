from django.urls import path
from . import views

urlpatterns = [
    path('upload-photo/', views.upload_photo, name='upload_photo'),
    path('get-all-photos/', views.get_photos, name='get_all_photos'),
    path('create-album/', views.create_album, name='create_album'),
    path('get-albums/', views.get_albums, name='get_albums'),
    path('get-album-photos/<uuid:album_id>/', views.get_album_photos, name='get_album_photos'),
]
 