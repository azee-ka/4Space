# research/urls.py
from django.urls import path
from .views import create_publication, list_user_publications, get_publication_detail

urlpatterns = [
    path('<slug:community_slug>/publications/create/', create_publication, name='create-publication'),
    path('<slug:community_slug>/my-publications/', list_user_publications, name='user-publications'),
    path('publication/<uuid:publication_id>/detail/', get_publication_detail, name='publication-detail'),
]
