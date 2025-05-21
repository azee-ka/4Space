from django.urls import path
from . import views

urlpatterns = [
    path('register/organization/', views.create_organization, name='create_organization'),
]
