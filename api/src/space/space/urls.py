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
    path('<uuid:space_id>/invitations/', views.list_invitations, name='list-invitations'),
    path('<uuid:space_id>/invitations/<uuid:invitation_id>/accept/', views.accept_invitation, name='accept-invitation'),  # ← ADD THIS
    path('<uuid:space_id>/invitations/<uuid:invitation_id>/decline/', views.decline_invitation, name='decline-invitation'),  # ← ADD THIS
    path('<uuid:space_id>/remove-collaborator/', views.remove_collaborator, name='remove-collaborator'),
    
    # Permissions
    path('<uuid:space_id>/permissions/', views.update_collaborator_permissions, name='update-permissions'),
    
    # Activity
    path('<uuid:space_id>/activity/', views.space_activity, name='space-activity'),
]