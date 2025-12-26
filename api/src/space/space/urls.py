# api/src/space/space/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Space CRUD
    path('', views.spaces_list_create, name='spaces-list-create'),
    path('<uuid:space_id>/', views.space_detail, name='space-detail'),
    
    # Widget operations
    path('<uuid:space_id>/widgets/', views.space_widgets, name='space-widgets'),
    path('<uuid:space_id>/widgets/<uuid:widget_id>/', views.widget_detail, name='widget-detail'),
    
    # Collaboration
    path('<uuid:space_id>/invite/', views.invite_collaborator, name='invite-collaborator'),
    path('<uuid:space_id>/remove-collaborator/', views.remove_collaborator, name='remove-collaborator'),
    
    # Activity
    path('<uuid:space_id>/activity/', views.space_activity, name='space-activity'),
]