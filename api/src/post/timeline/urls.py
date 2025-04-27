from django.urls import path
from . import views

urlpatterns = [
    # Get all posts (all types)
    path('get-posts/', views.timeline_posts, name='timeline_posts'),
]
