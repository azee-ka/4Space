# urls.py
from django.urls import path, include
from .views import search_users

urlpatterns = [
    path('user-search/', search_users, name='search-users'),
]
