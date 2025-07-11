# src/collection/urls.py

from django.urls import path
from .views import (
    list_collections,
    create_collection,
    add_item_to_collection,
    remove_item_from_collection,
    list_collection_items,
)

urlpatterns = [
    path('',                 list_collections,          name='list-collections'),
    path('create/',          create_collection,        name='create-collection'),
    path('add-item/',        add_item_to_collection,   name='add-item-to-collection'),
    path('remove-item/',     remove_item_from_collection, name='remove-item-to-collection'),
    path('<uuid:collection_id>/items/', list_collection_items, name='list-collection-items'),
]
