from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import ThreadPost, VisualPost
from ..serializers import PostRetrieveSerializer, MinimalThreadPostSerializer, MinimalVisualPostSerializer

from rest_framework.pagination import LimitOffsetPagination

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def timeline_posts(request):
    """
    Timeline view showing posts only from users the current user is following.
    """
    user = request.user

    following_users = user.following.all()  # Get all users the current user follows

    # Get posts authored by those users, ordered by newest
    thread_posts = ThreadPost.objects.filter(author__in=following_users)
    visual_posts = VisualPost.objects.filter(author__in=following_users)

    posts = list(thread_posts) + list(visual_posts)
    posts.sort(key=lambda x: x.created_at, reverse=True)  # Newest first

    # Paginate posts (as a list)
    paginator = LimitOffsetPagination()
    paginated_posts = paginator.paginate_queryset(posts, request)

    # Serialize paginated posts
    serialized_posts = []
    for post in paginated_posts:
        if isinstance(post, ThreadPost):
            serializer = PostRetrieveSerializer(post, context={'request': request})
        elif isinstance(post, VisualPost):
            serializer = PostRetrieveSerializer(post, context={'request': request})
        serialized_posts.append(serializer.data)

    # Return paginated response (includes next/previous links and count)
    return paginator.get_paginated_response(serialized_posts)
