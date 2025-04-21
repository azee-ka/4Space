from django.urls import path
from . import views

urlpatterns = [
    path('register/organization/', views.create_organization_view, name='create_organization'),
]
