from django.urls import path
from .views import list_exchanges, create_exchange

urlpatterns = [
    path('list/', list_exchanges, name='list_exchanges'),
    path('create/', create_exchange, name='create_exchange'),
]
