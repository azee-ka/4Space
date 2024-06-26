from django.urls import path, include

urlpatterns = [
    path('', include('src.user.baseUser.urls')),
    path('', include('src.user.timelineUser.urls')),
]
