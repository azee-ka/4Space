from django.urls import path, include

urlpatterns = [
    path('user/', include('src.user.urls')),
    path('post/', include('src.post.urls')),
]
