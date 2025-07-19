# urls.py
from django.urls import path, include

urlpatterns = [
    path('', include('src.space.workspace.urls')),
    path('', include('src.space.finance.urls')),
]