from django.urls import path, include

urlpatterns = [
    path('user/', include('src.user.urls')),
    path('post/', include('src.post.urls')),
    path('apps/', include('src.apps.urls')),
    path('components/', include('src.components.urls')),
]
