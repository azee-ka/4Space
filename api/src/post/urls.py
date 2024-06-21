from django.urls import path, include

urlpatterns = [
    path('', include('src.post.createPost.urls')),
    path('', include('src.post.expandPost.urls')),
    path('timeline/', include('src.post.timeline.urls')),
]