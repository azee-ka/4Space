# urls.py
from django.urls import path, include

urlpatterns = [
    path('collection/', include('src.central.collection.urls')),
]