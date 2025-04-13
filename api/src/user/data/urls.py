from django.urls import path
from . import views

urlpatterns = [
    path('posts-list/<str:username>/', views.get_profile_posts_list, name='posts-list'),
]