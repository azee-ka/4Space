from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from ..post.models import Post
from ..tracking.models import PostFeatures
from ..post.serializers import PostSerializer

class PostPagination(PageNumberPagination):
    page_size = 10  # Number of posts per page
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore_page(request):
    # Get all posts with their features
    posts = Post.objects.prefetch_related('features').all()

    # Example: Simple recommendation based on most likes and comments
    posts = sorted(posts, key=lambda p: (p.features.like_count, p.features.comment_count), reverse=True)

    # Paginate the posts
    paginator = PostPagination()
    paginated_posts = paginator.paginate_queryset(posts, request)
    serialized_posts = PostSerializer(paginated_posts, many=True)

    return paginator.get_paginated_response(serialized_posts.data)
