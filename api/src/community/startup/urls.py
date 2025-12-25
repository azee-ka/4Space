# startup/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('<slug:community_slug>/startups/create/', views.create_startup, name='create-startup'),
    path('<slug:community_slug>/startups/', views.list_startups, name='list-startups'),
]
