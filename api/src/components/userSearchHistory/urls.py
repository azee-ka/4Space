# urls.py
from django.urls import path
from .views import store_search_history, get_search_history, delete_search_history

urlpatterns = [
    path('store/<int:user_id>/', store_search_history, name='store_search_history'),
    path('history/', get_search_history, name='get_search_history'),
    path('delete/<int:user_id>/', delete_search_history, name='delete_search_history'),
]
