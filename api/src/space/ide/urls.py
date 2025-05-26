# space/ide/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("tools/<uuid:project_id>/code/files/", views.code_files_view),
    path("tools/<uuid:project_id>/code/file/<int:file_id>/", views.code_file_detail_view),
]
