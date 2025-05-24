from django.urls import path
from . import views

urlpatterns = [
    path("projects/", views.projects_view),
    path("tools/<int:project_id>/<str:tool>/", views.tool_content_view),
]
