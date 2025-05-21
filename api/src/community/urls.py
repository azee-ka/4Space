from django.urls import path, include
from . import views

urlpatterns = [
    path('create/', views.create_community, name='create_community'),
    path('c/<uuid:community_id>/', views.get_community_by_id, name='get_community_by_id'),
    path('c/<uuid:community_id>/update/', views.update_community, name='update_community'),
    path('c/<uuid:community_id>/permissions/<uuid:user_id>/', views.user_permissions, name='get_set_user_permissions'),

]
