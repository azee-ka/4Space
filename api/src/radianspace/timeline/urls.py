from django.urls import path
from . import views

urlpatterns = [
    # Packet views
    path('flares-list/', views.get_timeline_feed, name='flares-list' ),
]