from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Packet
from .serializers import PacketSerializer, CreatePacketSerializer
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like_dislike(request, packet_id):
    packet = get_object_or_404(Packet, uuid=packet_id)
    user = request.user

    if request.method == 'POST':
        action = request.data.get('toggle_type')
        if action == 'like':
            if user in packet.likes.all():
                packet.likes.remove(user)
            else:
                packet.likes.add(user)
                packet.dislikes.remove(user)
        elif action == 'dislike':
            if user in packet.dislikes.all():
                packet.dislikes.remove(user)
            else:
                packet.dislikes.add(user)
                packet.likes.remove(user)

        packet.likes_count = packet.likes.count()
        packet.dislikes_count = packet.dislikes.count()
        packet.save()
        
        like_count = packet.likes.count()
        dislike_count = packet.dislikes.count()
        user_has_liked = packet.likes.filter(id=user.id).exists()
        user_has_disliked = packet.dislikes.filter(id=user.id).exists()

        return Response({
            'likes_count': like_count,
            'dislikes_count': dislike_count,
            'like_status': 'liked' if user_has_liked else 'not_liked',
            'dislike_status': 'disliked' if user_has_disliked else 'not_disliked',
        }, status=status.HTTP_200_OK)

    return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_packet(request, packet_id):
    """
    Handles retrieving an existing packet.
    """
    if request.method == 'GET' and packet_id:
        # Retrieve a specific packet
        try:
            packet = Packet.objects.get(uuid=packet_id)
        except Packet.DoesNotExist:
            raise NotFound(detail="Packet not found.")
        serializer = PacketSerializer(packet, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_packet(request):
    """
    Handles creating a new packet
    """
    if request.method == 'POST':
        serializer = CreatePacketSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            packet = serializer.save()
            return Response({"uuid": packet.uuid}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)