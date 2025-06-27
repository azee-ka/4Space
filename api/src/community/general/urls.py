# src/apps/communities/community/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Exchanges
    path('<slug:slug>/exchanges/list/', views.list_exchanges, name='list_exchanges'),
    path('<slug:slug>/exchanges/create/', views.create_exchange, name='create_exchange'),
    path('exchanges/e/<uuid:exchange_id>/', views.retrieve_exchange, name='retrieve_exchange'),
    path('exchanges/e/<uuid:exchange_id>/vote/', views.vote_exchange_post, name='vote_exchange_post'),

    # Comments (ExchangeReply)
    path('exchanges/e/<uuid:exchange_id>/comments/', views.list_comments, name='list_comments'),
    path('exchanges/e/<uuid:exchange_id>/comments/create/', views.create_comment, name='create_comment'),
    path('exchanges/comments/<uuid:comment_id>/replies/', views.list_replies, name='list_replies'),
    path('exchanges/comments/<uuid:comment_id>/vote/', views.vote_exchange_reply, name='vote_exchange_reply'),
]
