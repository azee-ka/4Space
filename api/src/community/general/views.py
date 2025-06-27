# src/apps/communities/community/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions    import IsAuthenticated, AllowAny
from rest_framework.response       import Response
from rest_framework                import status
from rest_framework.pagination     import PageNumberPagination
from django.shortcuts              import get_object_or_404
from django.contrib.contenttypes.models import ContentType

from .models       import ExchangePost, ExchangeReply
from ..models      import Community, CommunityMembership, CommunityPermission
from .serializers import (
    ExchangePostSerializer,
    CreateExchangePostSerializer,
    ExchangeReplySerializer,
    CreateExchangeReplySerializer,
)
from src.post.models   import Vote      # ← adjust this import


class ExchangeReplyPagination(PageNumberPagination):
    page_size            = 10
    page_size_query_param = 'page_size'


@api_view(['GET'])
@permission_classes([AllowAny])
def list_exchanges(request, slug):
    community = get_object_or_404(Community, slug__iexact=slug)
    if community.visibility == 'private':
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        if not CommunityMembership.objects.filter(user=request.user, community=community).exists():
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    qs = ExchangePost.objects.filter(community=community)
    serializer = ExchangePostSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_exchange(request, slug):
    community = get_object_or_404(Community, slug__iexact=slug)
    if not CommunityMembership.objects.filter(user=request.user, community=community).exists():
        return Response({"detail": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
    perm = CommunityPermission.objects.filter(community=community, user=request.user).first()
    if not perm or not perm.permissions.get("can_post_discussions", False):
        return Response({"detail": "No post permission."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CreateExchangePostSerializer(data=request.data)
    if serializer.is_valid():
        post = serializer.save(author=request.user, community=community)
        return Response(ExchangePostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def retrieve_exchange(request, exchange_id):
    post = get_object_or_404(ExchangePost, id=exchange_id)
    community = post.community
    if community.visibility == 'private':
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        if not CommunityMembership.objects.filter(user=request.user, community=community).exists():
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ExchangePostSerializer(post, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_comments(request, exchange_id):
    post = get_object_or_404(ExchangePost, id=exchange_id)
    qs = ExchangeReply.objects.filter(post=post, parent__isnull=True)
    paginator = ExchangeReplyPagination()
    page = paginator.paginate_queryset(qs, request)
    serializer = ExchangeReplySerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_comment(request, exchange_id):
    post = get_object_or_404(ExchangePost, id=exchange_id)
    serializer = CreateExchangeReplySerializer(data=request.data)
    if serializer.is_valid():
        reply = serializer.save(author=request.user, post=post)
        post.comments_count = post.comments.filter(parent__isnull=True).count()
        post.save(update_fields=['comments_count'])
        return Response(ExchangeReplySerializer(reply, context={'request': request}).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_replies(request, comment_id):
    parent = get_object_or_404(ExchangeReply, id=comment_id)
    qs = parent.replies.all()
    paginator = ExchangeReplyPagination()
    page = paginator.paginate_queryset(qs, request)
    serializer = ExchangeReplySerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


#
# ─── VOTE ON A POST ───────────────────────────────────────────────────────────────
#
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_exchange_post(request, exchange_id):
    post = get_object_or_404(ExchangePost, id=exchange_id)
    vt   = request.data.get('vote_type')
    if vt not in ('upvote', 'downvote'):
        return Response({'error': 'Invalid vote_type'}, status=status.HTTP_400_BAD_REQUEST)

    ct       = ContentType.objects.get_for_model(post)
    existing = Vote.objects.filter(user=request.user, content_type=ct, object_id=post.id).first()

    if existing:
        if existing.vote_type == vt:
            existing.delete()
            msg, status_str = f"{vt} removed.", 'none'
        else:
            existing.vote_type = vt
            existing.save()
            msg, status_str = f"Changed to {vt}.", f"{vt}d"
    else:
        Vote.objects.create(user=request.user, content_type=ct, object_id=post.id, vote_type=vt)
        msg, status_str = f"{vt}d successfully.", f"{vt}d"

    up   = Vote.objects.filter(content_type=ct, object_id=post.id, vote_type='upvote').count()
    down = Vote.objects.filter(content_type=ct, object_id=post.id, vote_type='downvote').count()

    return Response({
        'message': msg,
        'stats': {
            'upvotes_count':   up,
            'downvotes_count': down,
            'net_votes_count': up - down,
            'comments_count':  post.comments.filter(parent__isnull=True).count(),
        },
        'status': {'vote_status': status_str},
    })


#
# ─── VOTE ON A REPLY ──────────────────────────────────────────────────────────────
#
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_exchange_reply(request, comment_id):
    reply = get_object_or_404(ExchangeReply, id=comment_id)
    vt    = request.data.get('vote_type')
    if vt not in ('upvote', 'downvote'):
        return Response({'error': 'Invalid vote_type'}, status=status.HTTP_400_BAD_REQUEST)

    ct       = ContentType.objects.get_for_model(reply)
    existing = Vote.objects.filter(user=request.user, content_type=ct, object_id=reply.id).first()

    if existing:
        if existing.vote_type == vt:
            existing.delete()
            msg, status_str = f"{vt} removed.", 'none'
        else:
            existing.vote_type = vt
            existing.save()
            msg, status_str = f"Changed to {vt}.", f"{vt}d"
    else:
        Vote.objects.create(user=request.user, content_type=ct, object_id=reply.id, vote_type=vt)
        msg, status_str = f"{vt}d successfully.", f"{vt}d"

    up   = Vote.objects.filter(content_type=ct, object_id=reply.id, vote_type='upvote').count()
    down = Vote.objects.filter(content_type=ct, object_id=reply.id, vote_type='downvote').count()

    return Response({
        'message': msg,
        'stats': {
            'upvotes_count':   up,
            'downvotes_count': down,
            'net_votes_count': up - down,
        },
        'status': {'vote_status': status_str},
    })
