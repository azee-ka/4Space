# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('interact-data/<int:user_id>/', views.interact_user_data, name='interact_user_data'),
    path('profile/<str:username>/', views.profile_view, name='profile_view'),
]
