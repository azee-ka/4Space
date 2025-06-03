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
    Supports an optional ?post_type=Thread or ?post_type=Visual filter (just like explore_posts).
    """
    user = request.user
    post_type = request.GET.get('post_type', None)

    # 1) Gather only the authors this user is following:
    following_users = user.following.all()

    paginator = LimitOffsetPagination()

    # 2) Branch based on post_type query param:
    if post_type == "Thread":
        # Only thread posts from followed users
        qs = ThreadPost.objects.filter(author__in=following_users).order_by('-created_at')
        page = paginator.paginate_queryset(qs, request)
        serialized = [
            PostRetrieveSerializer(thread, context={'request': request}).data
            for thread in page
        ]

    elif post_type == "Visual":
        # Only visual posts from followed users
        qs = VisualPost.objects.filter(author__in=following_users).order_by('-created_at')
        page = paginator.paginate_queryset(qs, request)
        serialized = [
            PostRetrieveSerializer(visual, context={'request': request}).data
            for visual in page
        ]

    else:
        # Combined case: fetch both types, merge, and sort by created_at
        thread_qs = ThreadPost.objects.filter(author__in=following_users)
        visual_qs = VisualPost.objects.filter(author__in=following_users)

        all_posts = list(thread_qs) + list(visual_qs)
        all_posts.sort(key=lambda obj: obj.created_at, reverse=True)

        page = paginator.paginate_queryset(all_posts, request)
        serialized = []
        for obj in page:
            if isinstance(obj, ThreadPost):
                serialized.append(
                    PostRetrieveSerializer(obj, context={'request': request}).data
                )
            else:  # VisualPost
                serialized.append(
                    PostRetrieveSerializer(obj, context={'request': request}).data
                )

    # 3) Return the paginated response
    return paginator.get_paginated_response(serialized)