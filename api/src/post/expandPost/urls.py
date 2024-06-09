# api/time_line/expandPost/urls.py

from django.urls import path
from .views import get_post_by_id, create_comment, create_like, create_dislike, delete_post

urlpatterns = [
    path('<uuid:post_id>/', get_post_by_id, name='get_post_by_id'),
    path('<uuid:post_id>/comment/', create_comment, name='create-comment'),
    path('<uuid:post_id>/like/', create_like, name='like-post'),
    path('<uuid:post_id>/dislike/', create_dislike, name='dislike-post'),
    path('<uuid:post_id>/delete/', delete_post, name='delete-post'),
]