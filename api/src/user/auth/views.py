from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..serializers import UserCreateSerializer
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.authtoken.models import Token

from ...organization.models import OrganizationMembership

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    data = request.data.copy()
    acc_type = data.get("type")  # "organization" or "individual"
    org_role = data.get("org_role")  # "admin" or "member"

    if acc_type not in ['organization', 'individual']:
        return Response({"error": "Invalid account type."}, status=400)

    # Keep base role for visibility mode — not for org logic
    data['role'] = 'professional'  # Default profile role (your feature)

    serializer = UserCreateSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        user.set_password(request.data['password'])
        user.save()

        token, _ = Token.objects.get_or_create(user=user)
        response_data = {
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'account_type': acc_type,
            },
            'token': token.key,
        }

        # Only include org_role if it's an org-related account
        if acc_type == 'organization' and org_role:
            response_data['user']['org_role'] = org_role

        return Response(response_data, status=201)
    return Response(serializer.errors, status=400)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        # Check all memberships for approval
        unapproved_memberships = OrganizationMembership.objects.filter(user=user, is_approved=False)
        if unapproved_memberships.exists():
            return Response(
                {"message": "Your account is pending approval by an organization."},
                status=403
            )

        # Login the user and generate a new token
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        response_data = {'user': {'id': user.id, 'username': user.username, 'role': user.role}, 'token': token.key}
        return Response(response_data, status=200)
    else:
        return Response({"message": "Invalid credentials"}, status=401)
    
    
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_view(request):
    user = request.user

    # Optionally revoke the token (good practice)
    Token.objects.filter(user=user).delete()

    # Delete the user
    user.delete()

    return Response({"message": "User account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)