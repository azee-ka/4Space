from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ..models import Flare
from ..serializers import TimelineFlareSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timeline_feed(request):
    user = request.user  # Get the requesting user

    # Assuming there is a Many-to-Many relationship `follows` on the User model
    # to represent the users the current user is following
    followed_users = user.following.all()  # Get the users this user follows

    # Fetch Flare objects authored by followed users
    flares = Flare.objects.filter(author__in=followed_users).order_by('-created_at')  # Sorted by newest first

    # Serialize the data
    serializer = TimelineFlareSerializer(flares, context={'request': request}, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)
