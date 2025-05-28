# space/repos/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("", views.repositories_view, name="repositories"),
    path("repository/<uuid:repo_id>/", views.repository_detail),
    path("repository/<uuid:repo_id>/upload-structure/", views.upload_repository_structure,name="upload-repo-structure"),
]
