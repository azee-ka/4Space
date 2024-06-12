from django.urls import path, include

urlpatterns = [
    path('chats/', include('src.apps.chats.urls')),
]
