# File: src/post/profile/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django.shortcuts import get_object_or_404

from ...user.models import BaseUser
from ...post.models import ThreadPost, VisualPost
from ...post.serializers import PostRetrieveSerializer

from ...community.models import Community, CommunityMembership
from ...community.serializers import CommunityDetailSerializer
from ...community.general.models import ExchangePost
from ...community.general.serializers import ExchangePostSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_exchanges(request, username):
    """
    Paginated list of ExchangePost authored by <username>, respecting profile privacy.
    URL example: /api/profile/{username}/exchanges/?limit=20&offset=0
    """
    viewer = request.user
    profile_user = get_object_or_404(BaseUser, username=username)

    # 1) Privacy check
    is_self = (viewer == profile_user)
    follows_them = profile_user.followers.filter(id=viewer.id).exists()

    if not is_self and profile_user.is_private_profile and not follows_them:
        # Return empty paginated response
        paginator = LimitOffsetPagination()
        empty_list = []
        return paginator.get_paginated_response(empty_list)

    # 2) Fetch all ExchangePost by that user
    #    Optionally: you could filter to only “visible” communities, but
    #    because ExchangePostSerializer itself will check membership if needed, keep it simple.
    qs = ExchangePost.objects.filter(author=profile_user).order_by('-created_at')

    # 3) Paginate
    paginator = LimitOffsetPagination()
    page = paginator.paginate_queryset(qs, request)  # list of ExchangePost instances

    # 4) Serialize page
    serializer = ExchangePostSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_communities(request, username):
    """
    List of all communities created_by <username>, respecting profile privacy.
    URL example: /api/profile/{username}/communities/
    (no pagination—this will return a flat list)
    """
    viewer = request.user
    profile_user = get_object_or_404(BaseUser, username=username)

    # Privacy check
    is_self = (viewer == profile_user)
    follows_them = profile_user.followers.filter(id=viewer.id).exists()

    if not is_self and profile_user.is_private_profile and not follows_them:
        return Response([], status=200)

    # Fetch communities that the user created
    qs = Community.objects.filter(created_by=profile_user).order_by('-created_at')
    serializer = CommunityDetailSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data, status=200)














@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_posts_list(request, username):
    """
    Paginated list of ThreadPost & VisualPost by <username>, respecting privacy.
    Optionally filter by ?post_type=Visual or ?post_type=Thread.

    • If viewing your own profile → return all posts (or filtered by post_type).
    • Else if profile is private AND you’re NOT a follower → return no posts.
    • Otherwise (public or you follow them) → return their posts (or filtered by post_type).

    Examples:
      GET /api/profile/posts/alice/list/?limit=20&offset=0
      GET /api/profile/posts/alice/list/?post_type=Visual&limit=20&offset=0
      GET /api/profile/posts/alice/list/?post_type=Thread&limit=10&offset=10
    """
    viewer = request.user
    profile_user = get_object_or_404(BaseUser, username=username)

    # 1) Privacy check:
    is_self = (viewer == profile_user)
    follows_them = profile_user.followers.filter(id=viewer.id).exists()

    if not is_self and profile_user.is_private_profile and not follows_them:
        # Return an empty paginated response (count=0).
        paginator = LimitOffsetPagination()
        page = paginator.paginate_queryset([], request)
        return paginator.get_paginated_response(page)

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
    page = paginator.paginate_queryset(posts_list, request)

    # 5) Serialize “page”:
    serialized = [
        PostRetrieveSerializer(obj, context={'request': request}).data
        for obj in page
    ]
    return paginator.get_paginated_response(serialized)
