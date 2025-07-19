# urls.py
from django.urls import path, include

urlpatterns = [
    path('', include('src.space.finance.trade.urls')),
]