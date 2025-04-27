# communities/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Community
from .serializers import CommunityCreateSerializer, CommunityMinimalSerializer, CommunityDetailSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_communities(request):
    communities = Community.objects.filter(creator=request.user, is_active=True)
    serializer = CommunityMinimalSerializer(communities, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def community_detail(request, slug):
    try:
        community = Community.objects.get(slug=slug, is_active=True)
    except Community.DoesNotExist:
        return Response({"detail": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = CommunityDetailSerializer(community)
    return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_community(request):
    serializer = CommunityCreateSerializer(data=request.data)
    
    if serializer.is_valid():
        community = serializer.save(creator=request.user)  # assign current user as creator
        return Response({
            "message": "Community created successfully.",
            "community_id": str(community.id),
            "slug": community.slug
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
