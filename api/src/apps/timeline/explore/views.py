# src/post/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from ..post.models import Post, PostFeatures
from ..post.serializers import PostSerializer, MinimalPostSerializer

class PostPagination(PageNumberPagination):
    page_size = 10  # Number of posts per page
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore_page(request):
    # Get all posts with their features
    posts = Post.objects.prefetch_related('features').all()

    # Handle posts without features
    posts_with_features = []
    for post in posts:
        try:
            features = post.features
            posts_with_features.append(post)
        except PostFeatures.DoesNotExist:
            # Optionally, log the missing features or handle it as needed
            pass

    # Example: Simple recommendation based on most likes and comments
    sorted_posts = sorted(posts_with_features, key=lambda p: (p.features.like_count, p.features.comment_count), reverse=True)

    # Paginate the posts
    paginator = PostPagination()
    paginated_posts = paginator.paginate_queryset(sorted_posts, request)
    serialized_posts = MinimalPostSerializer(paginated_posts, many=True)

    return paginator.get_paginated_response(serialized_posts.data)
