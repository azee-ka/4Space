from django.urls import path
from . import views

urlpatterns = [
    # Posts:
    path('posts/<str:username>/list/', views.get_profile_posts_list, name='posts-list'),
    # Exchanges:
    path('<str:username>/exchanges/', views.get_user_exchanges, name='get_user_exchanges'),
    # Communities the user created:
    path('<str:username>/communities/', views.get_user_communities, name='get_user_communities'),

]