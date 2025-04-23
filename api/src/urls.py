# urls.py
from django.urls import path, include

urlpatterns = [
    path('', include('src.user.urls')),
    path('', include('src.organization.urls')),
    path('notifications/', include('src.notifications.urls')),
    path('messages/', include('src.messaging.urls')),
    path('posts/', include('src.post.urls')),
    path('search/', include('src.userSearchHistory.urls')),
    path('report/', include('src.report.urls')),
]