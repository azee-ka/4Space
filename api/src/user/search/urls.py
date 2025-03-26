from django.urls import path
from .views import user_search

urlpatterns = [
    path('search/user/', user_search, name='user-search'),
]
