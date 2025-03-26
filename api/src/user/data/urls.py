from django.urls import path
from . import views

urlpatterns = [
    path('flares-list/<str:username>/', views.get_profile_flares_list, name='create-flares'),
    path('entries-list/<str:username>/', views.get_profile_entries_list, name='create-entries'),
    path('packets-list/<str:username>/', views.get_profile_packets_list, name='create-entries'),
]