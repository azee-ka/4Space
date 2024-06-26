# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.contrib.contenttypes.models import ContentType
from .models import BaseUser
from .serializers import BaseUserSerializer, UserProfileUpdateSerializer
from ..interactUser.models import InteractUser
from ..interactUser.serializers import BaseInteractUserSerializer
from django.shortcuts import get_object_or_404

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    base_user = request.user  # This gives you the authenticated user of type BaseUser
    serializer = BaseUserSerializer(base_user)
    return Response(serializer.data, status=200)
  
    
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user:
        # Login the user and generate a new token
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)

        response_data = {'user': {'id': user.id, 'username': user.username}, 'token': token.key}
        return Response(response_data, status=200)
    else:
        return Response({"message": "Invalid credentials"}, status=401)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = BaseInteractUserSerializer(data=request.data)
    if serializer.is_valid():
        # Save the serializer data and handle password setting separately
        user_instance = serializer.save()
        user = user_instance.user
        # Additional logic for setting password, generating token, etc.
        user.set_password(request.data['password'])
        user.save()

        token, created = Token.objects.get_or_create(user=user)
        response_data = {'user': {'id': user.id, 'username': user.username}, 'token': token.key}
        return Response(response_data, status=201)
    else:
        print(f"Registration Failed. Errors: {serializer.errors}")
        return Response(serializer.errors, status=400)
    
    
@api_view(['GET'])
@permission_classes([AllowAny])  # Adjust permission classes as per your application's requirements
def get_user_id(request, username):
    try:
        user = get_object_or_404(BaseUser, username=username)
        return Response({'user_id': user.id}, status=status.HTTP_200_OK)
    except BaseUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    
    serializer = UserProfileUpdateSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)