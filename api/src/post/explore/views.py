from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import ThreadPost, VisualPost
from ..serializers import MinimalThreadPostSerializer, MinimalVisualPostSerializer  # unified serializer you already have

from rest_framework.pagination import LimitOffsetPagination

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore_posts(request):
    posts = list(ThreadPost.objects.all()) + list(VisualPost.objects.all())
    posts.sort(key=lambda x: x.created_at, reverse=True)

    # Paginate
    paginator = LimitOffsetPagination()
    paginated_posts = paginator.paginate_queryset(posts, request)

    serialized_posts = []
    for post in paginated_posts:
        if isinstance(post, ThreadPost):
            serializer = MinimalThreadPostSerializer(post, context={'request': request})
        elif isinstance(post, VisualPost):
            serializer = MinimalVisualPostSerializer(post, context={'request': request})
        serialized_posts.append(serializer.data)

    return paginator.get_paginated_response(serialized_posts)
