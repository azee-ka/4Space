# research/urls.py
from django.urls import path
from .views import create_publication, list_user_publications, get_publication_detail

urlpatterns = [
    path('<uuid:community_id>/publications/create/', create_publication, name='create-publication'),
    path('<uuid:community_id>/my-publications/', list_user_publications, name='user-publications'),
    path('publication/<uuid:publication_id>/detail/', get_publication_detail, name='publication-detail'),
]
