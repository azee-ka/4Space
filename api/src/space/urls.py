# urls.py
from django.urls import path, include

urlpatterns = [
    path('', include('src.space.workspace.urls')),
    path('finance/', include('src.space.finance.urls')),
]