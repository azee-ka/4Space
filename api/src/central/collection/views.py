from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from .models import Collection, CollectionItem
from .serializers import CollectionSerializer, CollectionItemSerializer
from django.shortcuts import get_object_or_404

# List all collections
@api_view(['GET'])
def list_collections(request):
    collections = Collection.objects.filter(user=request.user)
    serializer = CollectionSerializer(collections, many=True)
    return Response(serializer.data)

# Create a new collection
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_collection(request):
    name = request.data.get('name')
    is_default = request.data.get('is_default', False)

    if not name:
        return Response({'message': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)

    collection = Collection.objects.create(user=request.user, name=name, is_default=is_default)
    serializer = CollectionSerializer(collection)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

# Get details of a specific collection
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_collection(request, collection_id):
    collection = get_object_or_404(Collection, id=collection_id, user=request.user)
    serializer = CollectionSerializer(collection)
    return Response(serializer.data)

# Add an item to a collection
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_collection_item(request, collection_id):
    collection = get_object_or_404(Collection, id=collection_id, user=request.user)
    content_type = request.data.get('content_type')  # For Flare, Packet, Entry, etc.
    object_id = request.data.get('object_id')

    if not content_type or not object_id:
        return Response({'message': 'content_type and object_id are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Retrieve the content_type class and object instance dynamically
    try:
        content_type_obj = ContentType.objects.get(model=content_type)
        content_object = content_type_obj.model_class().objects.get(id=object_id)
    except (ContentType.DoesNotExist, content_type_obj.model_class().DoesNotExist):
        return Response({'message': 'Invalid content_type or object_id'}, status=status.HTTP_400_BAD_REQUEST)

    # Create a new collection item
    collection_item = CollectionItem.objects.create(
        collection=collection,
        content_type=content_type_obj,
        object_id=object_id
    )

    # Serialize the newly added item
    item_serializer = CollectionItemSerializer(collection_item)
    return Response(item_serializer.data, status=status.HTTP_201_CREATED)

# Remove an item from a collection
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_collection_item(request, collection_id, item_id):
    collection = get_object_or_404(Collection, id=collection_id, user=request.user)
    collection_item = get_object_or_404(CollectionItem, id=item_id, collection=collection)

    collection_item.delete()
    return Response({'message': 'Item removed from collection'}, status=status.HTTP_204_NO_CONTENT)

# Delete a collection
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_collection(request, collection_id):
    collection = get_object_or_404(Collection, id=collection_id, user=request.user)
    collection.delete()
    return Response({'message': 'Collection deleted'}, status=status.HTTP_204_NO_CONTENT)
