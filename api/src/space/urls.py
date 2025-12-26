# urls.py
from django.urls import path, include

urlpatterns = [
    path('workspace/', include('src.space.workspace.urls')),
    path('finance/', include('src.space.finance.urls')),
    path('space/', include('src.space.space.urls')),
]