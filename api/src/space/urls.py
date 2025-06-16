# urls.py
from django.urls import path, include

urlpatterns = [
    path('projects/', include('src.space.projects.urls')),
    path('library/', include('src.space.library.urls')),
    path('repositories/', include('src.space.repos.urls')),
    path('space/', include('src.space.space.urls')),
]