# urls.py
from django.urls import path, include

urlpatterns = [
    path('projects/', include('src.space.projects.urls')),
    path('library/', include('src.space.library.urls')),
]