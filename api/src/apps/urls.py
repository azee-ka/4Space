from django.urls import path, include

urlpatterns = [
    path('chats/', include('src.apps.chats.urls')),
    path('photos/', include('src.apps.photos.urls')),
    path('taskflow/', include('src.apps.taskflow.urls')),
    path('timeline/', include('src.apps.timeline.urls')),
]
