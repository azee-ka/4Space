from django.urls import path
from . import views

urlpatterns = [
    path('save/', views.save_user_settings),
    path('load/', views.get_user_settings),
]
