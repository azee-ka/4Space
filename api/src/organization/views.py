from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Organization
from .serializers import OrganizationCreateSerializer

from ..organization.models import OrganizationMembership

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_organization(request):
    user = request.user

    # Check if user is already owner/admin of an org
    already_admin = OrganizationMembership.objects.filter(
        user=user,
        role__in=['owner', 'admin']
    ).exists()

    if already_admin:
        return Response(
            {"detail": "You are already an admin of an organization."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = OrganizationCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        org = serializer.save()
        return Response({
            "success": True,
            "organization_id": org.id,
            "slug": org.slug
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
