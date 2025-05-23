# research/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404

from .models import ResearchPublication
from .serializers import ResearchPublicationSerializer


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_publication(request, community_id):
    serializer = ResearchPublicationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(
            created_by=request.user,
            community_id=community_id
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_user_publications(request, community_id):
    queryset = ResearchPublication.objects.filter(
        created_by=request.user,
        community_id=community_id
    ).order_by('-created_at')
    serializer = ResearchPublicationSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_publication_detail(request, publication_id):
    publication = get_object_or_404(ResearchPublication, id=publication_id)
    serializer = ResearchPublicationSerializer(publication, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
