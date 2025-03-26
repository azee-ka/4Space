# urls.py
from django.urls import path, include

urlpatterns = [
    path('', include('src.central.collection.urls')),
]