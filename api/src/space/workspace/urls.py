# urls.py
from django.urls import path, include

urlpatterns = [
    path('projects/', include('src.space.workspace.projects.urls')),
    path('library/', include('src.space.workspace.library.urls')),
    path('repositories/', include('src.space.workspace.repos.urls')),
    path('spaceWorkspace/', include('src.space.workspace.spaceWorkspace.urls')),
]