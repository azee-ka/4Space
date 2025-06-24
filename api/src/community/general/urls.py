# community.general.urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('<slug:slug>/exchanges/list/',    views.list_exchanges,    name='list_exchanges'),
    path('<slug:slug>/exchanges/create/',  views.create_exchange,   name='create_exchange'),
    path('exchanges/e/<uuid:exchange_id>/', views.retrieve_exchange, name='retrieve_exchange'),
]
