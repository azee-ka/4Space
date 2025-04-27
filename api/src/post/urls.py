from django.urls import path, include
from . import views

urlpatterns = [
    # ==== POSTS ====
    # Create a new post (all types)
    path('post/', views.create_post, name='create_post'),

    # Retrieve all posts (for feed or explore)
    path('post/get-posts/', views.get_all_posts, name='get_all_posts'),

    # Retrieve a specific post by its UUID
    path('post/<uuid:post_id>/', views.get_post_by_id, name='get_post_by_id'),

    # Update a post by its UUID
    path('post/<uuid:post_id>/update/', views.update_post, name='update_post'),
    
    # Like/Unlike a comment
    path('post/<uuid:post_id>/toggle-like-dislike/', views.toggle_like_dislike, name='toggle_like_dislike'),

    # Delete a post by its UUID
    path('post/<uuid:post_id>/delete/', views.delete_post, name='delete_post'),

    # Retrieve posts by post type (e.g., "Poll", "Thread")
    path('post/type/<str:post_type>/', views.get_posts_by_type, name='get_posts_by_type'),
    
    
    # ==== COMMENTS ====
    path('post/comment/<uuid:post_id>/create/', views.create_comment, name='create_comment'),  # Comment on post
    path('post/comment/<uuid:comment_id>/reply/', views.create_reply, name='create_reply'),  # Reply to comment

    # ==== VOTING ====
    path('post/comment/<uuid:comment_id>/vote/', views.vote_comment, name='vote_comment'),  # Upvote/Downvote a comment

    # ==== LIKING ====
    path('post/comment/<uuid:comment_id>/like/', views.like_comment, name='like_comment'),  # Like/Unlike a comment
    
    
    path('explore/', include('src.post.explore.urls')),
    
]
