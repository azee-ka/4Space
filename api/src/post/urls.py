from django.urls import path
from . import views

urlpatterns = [
    # Create a new post (all types)
    path('post/', views.create_post, name='create_post'),

    # Retrieve all posts (for feed or explore)
    path('post/get-posts/', views.get_all_posts, name='get_all_posts'),

    # Retrieve a specific post by its UUID
    path('post/<uuid:post_id>/', views.get_post_by_id, name='get_post_by_id'),

    # Update a post by its UUID
    path('post/<uuid:post_id>/update/', views.update_post, name='update_post'),

    # Delete a post by its UUID
    path('post/<uuid:post_id>/delete/', views.delete_post, name='delete_post'),

    # Retrieve posts by post type (e.g., "Poll", "Thread")
    path('post/type/<str:post_type>/', views.get_posts_by_type, name='get_posts_by_type'),
]
