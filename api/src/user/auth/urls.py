from django.urls import path
from . import views

urlpatterns = [
    path('auth/google/', views.google_login_view),
    path('auth/github/login/', views.github_login_redirect),
    path('auth/github/callback/', views.github_callback),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('user/delete/', views.delete_user_view, name='delete_user'),
]
