from django.urls import path, include
from . import views

urlpatterns = [
    path('create/', views.create_community, name='create_community'),
    path('my-communities/', views.my_communities, name='my_communities'),
    path('<slug:slug>/', views.community_detail, name='community_detail'),
]
