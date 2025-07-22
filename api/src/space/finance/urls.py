# urls.py
from django.urls import path, include

urlpatterns = [
    path('trade/', include('src.space.finance.trade.urls')),
]