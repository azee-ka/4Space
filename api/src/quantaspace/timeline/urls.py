from django.urls import path
from . import views

urlpatterns = [
    # Packet views
    path('packets-list/', views.get_followed_user_packets, name='packet-list' ),
]