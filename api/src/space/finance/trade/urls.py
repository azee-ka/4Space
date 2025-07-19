from django.urls import path
from .views import chart_data, watchlist_list, watchlist_detail

urlpatterns = [
    path("chart-data/", chart_data, name="chart-data"),
    path("watchlists/",    watchlist_list,   name="watchlist-list"),
    path("watchlists/<int:pk>/", watchlist_detail, name="watchlist-detail"),
]