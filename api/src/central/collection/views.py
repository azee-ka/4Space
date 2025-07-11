# src/collection/views.py

import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django.contrib.contenttypes.models import ContentType

from .models import Collection, CollectionItem
from .serializers import (
    CollectionSerializer,
    CollectionItemSerializer,
    AddItemToCollectionSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_collections(request):
    """
    Return all of the current user’s collections, *plus* a `contains` flag
    (computed in the serializer) indicating whether each collection already
    has the given content_type/object_id.
    """
    user = request.user
    qs = Collection.objects.filter(owner=user).order_by('-created_at')
    serializer = CollectionSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_collection(request):
    serializer = CollectionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(owner=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_item_to_collection(request):
    serializer = AddItemToCollectionSerializer(
        data=request.data, context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response({'detail': 'Item added to collection'},
                        status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_item_from_collection(request):
    """
    Inverse of add_item_to_collection: quietly delete the matching CollectionItem.
    """
    cid       = request.data.get('collection_id')
    ct_param  = request.data.get('content_type')
    obj_param = request.data.get('object_id')

    try:
        ct = ContentType.objects.get(model=ct_param.lower())
    except ContentType.DoesNotExist:
        return Response({'detail': 'Invalid content type.'},
                        status=status.HTTP_400_BAD_REQUEST)

    CollectionItem.objects.filter(
        collection_id=cid,
        content_type=ct,
        object_id=obj_param,
        added_by=request.user
    ).delete()
    return Response({'detail': 'Item removed from collection'},
                    status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_collection_items(request, collection_id):
    collection = Collection.objects.get(id=collection_id)
    if collection.visibility == 'private' and collection.owner != request.user:
        return Response({'detail': 'Not authorized.'},
                        status=status.HTTP_403_FORBIDDEN)

    model_filter = request.GET.get('model')
    if not model_filter:
        return Response(
            {'detail': 'Missing `model` query parameter.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        ct = ContentType.objects.get(model=model_filter.lower())
    except ContentType.DoesNotExist:
        return Response(
            {'detail': f'Invalid model: {model_filter}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    # now *only* fetch items of that content type
    items = CollectionItem.objects.filter(
        collection=collection,
        content_type=ct
    ).order_by('-added_at')

    paginator = LimitOffsetPagination()
    page = paginator.paginate_queryset(items, request)
    serializer = CollectionItemSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
