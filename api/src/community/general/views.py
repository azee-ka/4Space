from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import ExchangePost
from ..models import Community, CommunityMembership, CommunityPermission
from .serializers import ExchangePostSerializer, CreateExchangePostSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_exchanges(request, community_id):
    try:
        community = Community.objects.get(id=community_id)
    except Community.DoesNotExist:
        return Response({"detail": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

    if not CommunityMembership.objects.filter(user=request.user, community=community).exists():
        return Response({"detail": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    posts = ExchangePost.objects.filter(community=community).order_by('-created_at')
    serializer = ExchangePostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_exchange(request, community_id):
    try:
        community = Community.objects.get(id=community_id)
    except Community.DoesNotExist:
        return Response({"detail": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

    if not CommunityMembership.objects.filter(user=request.user, community=community).exists():
        return Response({"detail": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    try:
        perm = CommunityPermission.objects.get(community=community, user=request.user)
        if not perm.permissions.get("can_post_discussions", False):
            return Response({"detail": "You don't have permission to post discussions."}, status=status.HTTP_403_FORBIDDEN)
    except CommunityPermission.DoesNotExist:
        return Response({"detail": "Permission not configured for this user."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CreateExchangePostSerializer(data=request.data)
    if serializer.is_valid():
        post = serializer.save(author=request.user, community=community)
        output = ExchangePostSerializer(post)
        return Response(output.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
