# urls.py
from django.urls import path
from .views import explore_page

urlpatterns = [
    path('posts/', explore_page, name='timeline-posts'),
]
