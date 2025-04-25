from django.urls import path
from . import views

urlpatterns = [
    # Get all posts (all types)
    path('get-posts/', views.explore_posts, name='explore_posts'),
]
