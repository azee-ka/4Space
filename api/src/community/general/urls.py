from django.urls import path
from .views import list_discussions, create_discussion

urlpatterns = [
    path('list/', list_discussions, name='list_discussions'),
    path('create/', create_discussion, name='create_discussion'),
]
