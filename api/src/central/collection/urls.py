from django.urls import path
from . import views

urlpatterns = [
    path('collections/', views.list_collections, name='list_collections'),
    path('collections/create/', views.create_collection, name='create_collection'),
    path('collections/<int:collection_id>/', views.get_collection, name='get_collection'),
    path('collections/<int:collection_id>/items/', views.add_collection_item, name='add_collection_item'),
    path('collections/<int:collection_id>/items/<int:item_id>/', views.delete_collection_item, name='delete_collection_item'),
    path('collections/<int:collection_id>/delete/', views.delete_collection, name='delete_collection'),
]
