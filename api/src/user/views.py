from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from .models import BaseUser
from .serializers import MinimalUserSerializer, MyProfileSerializer, PartialProfileSerializer, FullProfileSerializer, EditUserInfoSerializer
from django.shortcuts import get_object_or_404
from ..notifications.models import Notification



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request, username):
    """
    Retrieve user profile with a profile type indicator.
    """
    profile_user = get_object_or_404(BaseUser, username=username)
    is_following = request.user in profile_user.followers.all()
    follow_request_status = None

    # Fetch actionable notification (e.g., follow request) status
    if profile_user.is_private_profile and not is_following:
        try:
            follow_request = Notification.objects.get(
                sender=request.user,
                user=profile_user,
                type="action",
                status__in=["pending", "approved", "disapproved"],
                message__icontains=f"Requested to follow your account."            
            )
            follow_request_status = follow_request.status
        except Notification.DoesNotExist:
            pass
                
    # If the user is viewing their own profile
    if request.user == profile_user:
        serializer = MyProfileSerializer(profile_user)
        profile_type = 'self'
    # If the user is viewing someone else's profile
    else:
        # If the profile is private
        if profile_user.is_private_profile:
            # If profile is private and the user is a follower, they get full access
            if request.user in profile_user.followers.all():
                serializer = FullProfileSerializer(profile_user)
                profile_type = 'full'
            else:
                # If profile is private and the user is not a follower, they get partial access
                serializer = PartialProfileSerializer(profile_user)
                profile_type = 'partial'
        else:
            # If the profile is public, they get full access
            serializer = FullProfileSerializer(profile_user)
            profile_type = 'full'

    # Include the profile type in the response
    response_data = {
        **serializer.data,
        'view_type': profile_type,
        'interact': {
            'is_following': is_following,
            'follow_request_status': follow_request_status,
        }
    }
    return Response(response_data, status=200)




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def edit_basic_info(request):
    base_user = request.user

    if request.method == 'GET':
        serializer = EditUserInfoSerializer(base_user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = EditUserInfoSerializer(base_user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'profile_image' in request.FILES:
                base_user.profile_image = request.FILES['profile_image']
                base_user.save()
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    base_user = request.user  # This gives you the authenticated user of type BaseUser
    serializer = MinimalUserSerializer(base_user)
    return Response(serializer.data, status=200)



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def toggle_profile_visibility(request):
    """
    Handle profile visibility:
    - GET: Return the current `is_private_profile` status.
    - POST: Toggle the `is_private_profile` field for the authenticated user.
    """
    user = request.user

    if request.method == 'GET':
        # Return the current visibility status
        return Response(
            { "is_private_profile": user.is_private_profile },
            status=status.HTTP_200_OK
        )
    elif request.method == 'POST':
        # Toggle the `is_private_profile` field
        user.is_private_profile = not user.is_private_profile
        user.save()

        return Response(
            {
                "message": "Profile visibility updated successfully.",
                "is_private_profile": user.is_private_profile,
            },
            status=status.HTTP_200_OK
        )