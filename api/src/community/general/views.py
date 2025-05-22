from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import DiscussionPost
from community.models import Community, CommunityMembership
from .serializers import DiscussionPostSerializer

from community.models import CommunityPermission

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def discussion_posts(request, community_id):
    try:
        community = Community.objects.get(id=community_id)
    except Community.DoesNotExist:
        return Response({"detail": "Community not found"}, status=404)

    if not CommunityMembership.objects.filter(user=request.user, community=community).exists():
        return Response({"detail": "Unauthorized"}, status=403)

    if request.method == 'GET':
        posts = DiscussionPost.objects.filter(community=community)
        serializer = DiscussionPostSerializer(posts, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        # Permission check
        try:
            perm = CommunityPermission.objects.get(community=community, user=request.user)
            if not perm.permissions.get("can_post_discussions", False):
                return Response({"detail": "Permission denied: Cannot post discussions."}, status=403)
        except CommunityPermission.DoesNotExist:
            return Response({"detail": "Permission denied."}, status=403)

        serializer = DiscussionPostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(community=community, author=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
