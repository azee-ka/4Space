from django.urls import path
from . import views

urlpatterns = [
    path('workflow/', views.create_workflow),
    path('projects/', views.list_projects),
    path('workflow/<int:pk>/', views.get_workflow_detail),
    path('agent/<int:task_id>/run/', views.run_agent),
    path('agent/<int:task_id>/stream/', views.stream_agent, name='stream-agent'),
]
