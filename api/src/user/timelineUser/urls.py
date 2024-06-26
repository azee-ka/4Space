# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('interact-data/<int:user_id>/', views.interact_user_data, name='interact_user_data'),
    path('profile/<int:user_id>/', views.profile_view, name='profile_view'),
    
    path('toggle-profile-visibility/', views.toggle_profile_visibility, name='toggle-profile-visibility'),
    path('profile-visibility-status/', views.get_profile_visibility_status, name='profile-visibility-status'),
    
    path('<int:user_id>/follow/', views.follow_unfollow_user, name='follow_unfollow_user'),
    path('<int:user_id>/connect/', views.connect_disconnect_user, name='connect_disconnect_user'),
]
