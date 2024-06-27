# urls.py
from django.urls import path
from .views import timeline_posts

urlpatterns = [
    path('posts/', timeline_posts, name='timeline-posts'),
]
