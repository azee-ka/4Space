# research/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404

from .models import Startup
from .serializers import StartupSerializer
from src.community.models import Community

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_startup(request, community_slug):
    community = get_object_or_404(Community, slug=community_slug)
    serializer = StartupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(community=community)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_startups(request, community_slug):
    community = get_object_or_404(Community, slug=community_slug)
    startups = Startup.objects.filter(community=community)
    serializer = StartupSerializer(startups, many=True)
    return Response(serializer.data)
