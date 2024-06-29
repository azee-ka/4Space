# stocks/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('stocks/', views.stock_list, name='stocks-list'),
    path('stocks/<int:pk>/', views.stock_detail, name='stock-detail'),
    path('watchlist/', views.watchlist_list, name='watchlist-list'),
    path('watchlist/<int:pk>/', views.watchlist_detail, name='watchlist-detail'),
]
