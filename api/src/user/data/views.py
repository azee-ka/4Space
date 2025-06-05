# src/post/profile/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django.shortcuts import get_object_or_404

from ...user.models import BaseUser
from ...post.models import ThreadPost, VisualPost
from ...post.serializers import PostRetrieveSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_posts_list(request, username):
    """
    Paginated list of ThreadPost & VisualPost by <username>, respecting privacy.
    Optionally filter by ?post_type=Visual or ?post_type=Thread.

    • If viewing your own profile → return all posts (or filtered by post_type).
    • Else if profile is private AND you’re NOT a follower → return no posts.
    • Otherwise (public or you follow them) → return their posts (or filtered by post_type).

    Example:
      GET /api/profile/posts/alice/list/?limit=20&offset=0
      GET /api/profile/posts/alice/list/?post_type=Visual&limit=20&offset=0
    """
    viewer = request.user
    profile_user = get_object_or_404(BaseUser, username=username)

    # 1) Privacy check:
    is_self = (viewer == profile_user)
    follows_them = profile_user.followers.filter(id=viewer.id).exists()

    if not is_self and profile_user.is_private_profile and not follows_them:
        # Return an empty paginated response (count=0).
        paginator = LimitOffsetPagination()
        paginator.default_limit = 20
        return paginator.get_paginated_response([])

    # 2) Which post_type to fetch?
    post_type = request.GET.get('post_type', None)  # "Visual", "Thread", or None

    # 3) Build QuerySets based on post_type:
    posts_list = []
    if post_type == "Thread":
        thread_qs = ThreadPost.objects.filter(author=profile_user).order_by('-created_at')
        posts_list = list(thread_qs)

    elif post_type == "Visual":
        visual_qs = VisualPost.objects.filter(author=profile_user).order_by('-created_at')
        posts_list = list(visual_qs)

    else:
        # No filter → fetch both, then merge & sort
        thread_qs = ThreadPost.objects.filter(author=profile_user)
        visual_qs = VisualPost.objects.filter(author=profile_user)
        posts_list = list(thread_qs) + list(visual_qs)
        posts_list.sort(key=lambda obj: obj.created_at, reverse=True)

    # 4) Paginate the final list:
    paginator = LimitOffsetPagination()
    paginator.default_limit = 20
    page = paginator.paginate_queryset(posts_list, request)
    # page is now a Python list (never None, thanks to default_limit)

    # 5) Serialize “page”:
    serialized = [
        PostRetrieveSerializer(obj, context={'request': request}).data
        for obj in page
    ]
    return paginator.get_paginated_response(serialized)
