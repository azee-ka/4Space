from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ...radianspace.models import Flare
from ...radianspace.serializers import MinimalFlareSerializer
from ...axionspace.models import Entry
from ...axionspace.serializers import EntrySerializer
from ...quantaspace.models import Packet
from ...quantaspace.serializers import TimelinePacketSerializer
from ...user.models import BaseUser

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # You can add authentication as needed
def get_profile_flares_list(request, username):
    # Get the user object by username
    try:
        user = BaseUser.objects.get(username=username)
    except BaseUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    # Get all flares from the specified user
    user_flares = Flare.objects.filter(author=user)
    
    # Serialize the posts
    serializer = MinimalFlareSerializer(user_flares, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])  # You can add authentication as needed
def get_profile_entries_list(request, username):
    # Get the user object by username
    try:
        user = BaseUser.objects.get(username=username)
    except BaseUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    # Get all entries from the specified user
    user_entries = Entry.objects.filter(author=user)
    
    # Serialize the posts
    serializer = EntrySerializer(user_entries, many=True)
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])  # You can add authentication as needed
def get_profile_packets_list(request, username):
    # Get the user object by username
    try:
        user = BaseUser.objects.get(username=username)
    except BaseUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    # Get all packets from the specified user
    user_packets = Packet.objects.filter(author=user)
    
    # Serialize the posts
    serializer = TimelinePacketSerializer(user_packets, many=True)
    return Response(serializer.data)