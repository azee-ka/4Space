from django.urls import path
from . import views

urlpatterns = [
    # Exchange URLs
    path('exchanges/', views.exchange_list, name='exchange-list'),
    path('exchange/create/', views.create_exchange, name='create-exchange'),
    path('exchange/<uuid:exchange_id>/', views.exchange_detail, name='exchange-detail'),  # Use UUID here
    path('exchange/<uuid:exchange_id>/minimal-info/', views.minimal_exchange_detail, name='exchange-minimal-detail'),  # Use UUID here

    # Entry URLs
    path('exchange/<uuid:uuid>/create-entry/', views.create_entry, name='create_entry'),
    path('entry/<uuid:entry_id>/get-details/', views.entry_detail, name='entry-detail'),
    path('exchange/<uuid:exchange_id>/entries/', views.entry_list, name='entry-list'),

    path('exchange/<uuid:exchange_uuid>/vote/', views.vote_exchange, name='exchange-vote'),
    path('exchange/entry/<uuid:entry_uuid>/vote/', views.vote_entry, name='entry-vote'),

    # Comment URLs
    path('exchange/entry/<uuid:entry_uuid>/comment/', views.create_comment, name='create_comment'),
    path('exchange/entry/comment/<int:comment_id>/reply/', views.reply_to_comment, name='reply_to_comment'),
    path('entries/<int:entry_id>/comments/', views.comment_list, name='comment-list'),
    path('exchange/entry/comment/<int:comment_id>/vote/', views.vote_comment, name='vote_comment'),

    # Score URLs
    path('entries/<int:entry_id>/score/', views.score_entry, name='score-entry'),

    # Flag URLs
    path('entries/<int:entry_id>/flag/', views.flag_entry, name='flag-entry'),

    # Impact Score URLs
    path('entries/<int:entry_id>/impact/', views.impact_score_entry, name='impact-score-entry'),
]
