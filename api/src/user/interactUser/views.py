# views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import InteractUser
from .serializers import InteractUserSerializer, InteractUserBriefSerializer
from .serializers import PublicProfileSerializer, PrivateProfileSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interact_user_data(request, user_id):
    print(f'user_id {user_id}')
    try:
        user = InteractUser.objects.get(id=user_id)
    except InteractUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    serializer = InteractUserBriefSerializer(user)
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([AllowAny])
def profile_view(request, username):
    try:
        profile_owner = InteractUser.objects.get(username=username)
        is_private = profile_owner.is_private_profile
        
        if request.user.is_authenticated:
            requesting_user = request.user.interactuser  # Assuming the request user has a one-to-one relation with InteractUser

            if requesting_user == profile_owner:
                # If the requesting user is the profile owner, use the InteractUserSerializer
                serializer = InteractUserSerializer(profile_owner)
                return Response({
                    'profile': serializer.data,
                    'viewable': 'self'
                })

            if is_private:
                # Check if the requesting user is following or connected to the profile owner
                is_following = profile_owner.followers.filter(id=requesting_user.id).exists()
                is_connected = profile_owner.connections.filter(id=requesting_user.id).exists()

                if not (is_following or is_connected):
                    # If not following or connected, return only public data
                    serializer = PublicProfileSerializer(profile_owner)
                    return Response({
                        'profile': serializer.data,
                        'viewable': 'partial'
                    })

        else:
            # If the user is not authenticated and the profile is private, return unauthorized
            if is_private:
                return Response({'error': 'Unauthorized access to private profile'}, status=status.HTTP_401_UNAUTHORIZED)

        # If the profile is public or the user is allowed to view the private profile
        serializer = PrivateProfileSerializer(profile_owner)
        return Response({
            'profile': serializer.data,
            'viewable': 'full'
        })

    except InteractUser.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)