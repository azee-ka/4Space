# community.general.urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:community_id>/exchanges/list/', views.list_exchanges, name='list_exchanges'),
    path('<uuid:community_id>/exchanges/create/', views.create_exchange, name='create_exchange'),
    path('exchanges/e/<uuid:exchange_id>/', views.retrieve_exchange),
]
