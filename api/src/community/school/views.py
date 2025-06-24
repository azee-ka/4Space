from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from src.community.models import Community, CommunityMembership
from .models import CommunityAssignment, CommunityGrade
from .serializers import CommunityAssignmentSerializer, CommunityGradeSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assignments(request, slug):
    community = get_object_or_404(Community, slug__iexact=slug)

    if not CommunityMembership.objects.filter(user=request.user, community=community).exists():
        return Response({"detail": "Unauthorized"}, status=403)

    assignments = CommunityAssignment.objects.filter(community=community)
    serializer = CommunityAssignmentSerializer(assignments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_grades(request, slug):
    community = get_object_or_404(Community, slug__iexact=slug)

    if not CommunityMembership.objects.filter(user=request.user, community=community).exists():
        return Response({"detail": "Unauthorized"}, status=403)

    grades = CommunityGrade.objects.filter(community=community)
    serializer = CommunityGradeSerializer(grades, many=True)
    return Response(serializer.data)
