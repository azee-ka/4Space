from django.urls import path
from .views import discussion_posts

urlpatterns = [
    path('<uuid:community_id>/discussions/', discussion_posts, name='discussion_posts'),
]
