from django.urls import path
from . import views

urlpatterns = [
    path('posts/<str:username>/list/', views.get_profile_posts_list, name='posts-list'),
]