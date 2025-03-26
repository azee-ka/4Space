from django.urls import path
from . import views

urlpatterns = [
    path('flares-list/', views.get_explore_posts, name='create-post'),
]