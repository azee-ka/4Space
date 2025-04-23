from django.urls import path
from .views import user_search

urlpatterns = [
    path('user-search/', user_search, name='user-search'),
]
