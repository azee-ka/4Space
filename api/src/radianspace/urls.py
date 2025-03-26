from django.urls import path, include
from . import views

urlpatterns = [
    # Flare views
    path('create-flare/', views.create_flare, name='create-post'),
    path('flare/<int:flare_id>/delete/', views.delete_flare, name='delete-post'),

    path('flare/<uuid:flare_id>/', views.get_flare_by_id, name='get_post_by_id'),
    
    path('flare/<uuid:flare_id>/comment/', views.create_comment, name='create-comment'),
    path('flare/<uuid:flare_id>/like-dislike/', views.toggle_like_dislike, name='like-dislike-post'),
        
    # Comment
    path('flare/<uuid:comment_id>/create-reply/', views.create_reply, name='create-reply'),
    path('flare/<uuid:comment_id>/vote/', views.vote_comment, name='vote-comment'),
    path('flare/<uuid:comment_id>/comment-like/', views.like_comment, name='like-comment'),
    
    # Timeline
    path('timeline/', include('src.radianspace.timeline.urls')),
    
    # Explore
    path('explore/', include('src.radianspace.explore.urls')),
]
