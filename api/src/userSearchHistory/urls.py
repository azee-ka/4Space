# urls.py
from django.urls import path
from .views import store_search_history, get_search_history, delete_search_history

urlpatterns = [
    path('user-search/store/<str:searched_username>/', store_search_history, name='store_search_history'),
    path('user-search/history/', get_search_history, name='get_search_history'),
    path('user-search/delete/<str:username_to_delete>/', delete_search_history, name='delete_search_history'),
]
