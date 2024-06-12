from django.urls import path, include

urlpatterns = [
    path('search/', include('src.components.userSearch.urls')),
    path('search-history/', include('src.components.userSearchHistory.urls')),
]
