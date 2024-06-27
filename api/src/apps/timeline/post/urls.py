from django.urls import path, include

urlpatterns = [
    path('', include('src.apps.timeline.post.createPost.urls')),
    path('', include('src.apps.timeline.post.expandPost.urls')),
]