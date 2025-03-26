from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..models import Packet
from ..serializers import PacketSerializer, TimelinePacketSerializer
from rest_framework.exceptions import NotFound


@api_view(['GET'])
def get_followed_user_packets(request):
    """
    Get packets from users that the requesting user follows.
    """
    user = request.user  # The requesting user, assumed to be authenticated

    if not user.is_authenticated:
        return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

    # Get the list of users the current user is following
    followed_users = user.following.all()  # Assuming a 'following' field in the BaseUser model
    
    # Retrieve packets authored by followed users
    packets = Packet.objects.filter(author__in=followed_users).order_by('-created_at')

    serializer = TimelinePacketSerializer(packets, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
