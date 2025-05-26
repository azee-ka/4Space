# spaace/projects/urls.py
from django.urls import path, include
from . import views

urlpatterns = [
    path("", views.projects_view),
    path("tools/<uuid:project_id>/<str:tool>/", views.tool_content_view),
    
    path('tools/<uuid:project_id>/latex/render/', views.render_latex_pdf, name="render_latex_pdf"),

    path("", include("src.space.projects.ide.urls")),
]
