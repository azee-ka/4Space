# stocks/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('stocks/', views.stock_list, name='stocks-list'),
    path('search/', views.stock_search_view, name='stock_search'),
    path('stocks/<int:pk>/', views.stock_detail, name='stock-detail'),
    path('watchlist/', views.watchlist_view, name='watchlist'),
    path('add-to-watchlist/<int:stock_id>/', views.add_to_watchlist_view, name='add_to_watchlist'),
]
