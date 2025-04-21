from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Organization

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_organization_view(request):
    user = request.user

    if user.org_role != 'admin':
        return Response({'message': 'Only admins can create organizations.'}, status=403)

    org_data = request.data
    org = Organization.objects.create(
        name=org_data['name'],
        slug=org_data['slug'],
        domain=org_data.get('domain'),
        type=org_data.get('type', 'other'),
        require_domain_email=org_data.get('require_domain_email', False)
    )

    user.organization = org
    user.is_approved_by_org = True
    user.save()

    return Response({
        'organization': {
            'id': org.id,
            'name': org.name,
            'slug': org.slug,
            'type': org.type
        }
    }, status=201)
