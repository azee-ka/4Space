from django.urls import path, include
from . import views

urlpatterns = [
    # Create a new community
    path('create/', views.create_community, name='create_community'),

    # CRUD on communities by slug (case-insensitive)
    path('c/<slug:slug>/',                         views.get_community_by_slug,      name='get_community'),
    path('c/<slug:slug>/update/',                  views.update_community,          name='update_community'),
    path('c/<slug:slug>/permissions/<uuid:user_id>/', views.user_permissions,       name='get_set_user_permissions'),
    path('c/<slug:slug>/tabs/',                    views.add_tabs_to_community,      name='add_tabs_to_community'),

    # Membership actions
    path('<slug:slug>/join/',                      views.join_community,             name='join_community'),
    path('<slug:slug>/leave/',                     views.leave_community,            name='leave_community'),
    path('<slug:slug>/invite/',                    views.invite_user_to_community,   name='invite_user_community'),
    path('<slug:slug>/accept-invitation/',         views.accept_community_invitation,name='accept_community_invitation'),

    # List and permissions
    path('<slug:slug>/members/',                   views.community_members,          name='community_members'),
    path('<slug:slug>/permissions/<uuid:user_id>/', views.user_permissions),

    # Global list
    path('timeline/get-communities/',              views.list_communities,           name='list_communities'),

    # Include sub-apps
    path('', include('src.community.general.urls')),
    path('research/', include('src.community.research.urls')),
]
