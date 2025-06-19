from django.urls import path, include
from . import views

urlpatterns = [
    path('create/', views.create_community, name='create_community'),
    path('c/<uuid:community_id>/', views.get_community_by_id, name='get_community_by_id'),
    path('c/<uuid:community_id>/update/', views.update_community, name='update_community'),
    path('c/<uuid:community_id>/permissions/<uuid:user_id>/', views.user_permissions, name='get_set_user_permissions'),
    path('c/<uuid:community_id>/tabs/', views.add_tabs_to_community, name='add_tabs_to_community'),
    
    path('<uuid:community_id>/join/', views.join_community, name='join-community'),
    path('<uuid:community_id>/leave/', views.leave_community, name='leave-community'),
    path('<uuid:community_id>/invite/', views.invite_user_to_community, name='invite-user-community'),
    path('<uuid:community_id>/accept-invitation/', views.accept_community_invitation, name='accept-community-invitation'),

    path('<uuid:community_id>/members/', views.community_members),
    path('<uuid:community_id>/permissions/<uuid:user_id>/', views.user_permissions),
    
    path('timeline/get-communities/', views.list_communities, name='list_communities'),
    
    path('', include('src.community.general.urls')),
    path('research/', include('src.community.research.urls')),
]
