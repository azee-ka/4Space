from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..serializers import UserCreateSerializer
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.authtoken.models import Token

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.set_password(request.data['password'])
        user.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                'user': {
                    'id': user.id,
                    'username': user.username
                },
                'token': token.key,
            },
            status=201
        )
    return Response(serializer.errors, status=400)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        if user.organization and user.org_role == 'member':
            if not user.is_approved_by_org:
                return Response({"message": "Your account is pending approval."}, status=403)
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