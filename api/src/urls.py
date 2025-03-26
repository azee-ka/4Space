# urls.py
from django.urls import path, include

urlpatterns = [
    path('', include('src.user.urls')),
    path('notifications/', include('src.notifications.urls')),
    path('messages/', include('src.messaging.urls')),
    path('axionspace/', include('src.axionspace.urls')),
    path('radianspace/', include('src.radianspace.urls')),
    path('quantaspace/', include('src.quantaspace.urls')),
    path('report/', include('src.report.urls')),
    path('space/', include('src.space.urls')),
]