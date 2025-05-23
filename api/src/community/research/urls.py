
# research/urls.py
from django.urls import path
from .views import ResearchPublicationListCreate

urlpatterns = [
    path('<uuid:community_id>/publications/', ResearchPublicationListCreate.as_view(), name='research-publications'),
]