from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Album, PhotoElement
from .serializers import AlbumSerializer, PhotoElementSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_photo(request):
    if 'photos' not in request.FILES:
        return Response({'error': 'No photos provided'}, status=status.HTTP_400_BAD_REQUEST)

    photos = request.FILES.getlist('photos')
    user = request.user.interactuser

    for photo in photos:
        photo_element = PhotoElement.objects.create(user=user, file=photo, media_type='image')
        # Save the photo_element to extract and set actual_datetime
        photo_element.save()

    return Response({'message': 'Photos uploaded successfully'}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_photos(request):
    photos = PhotoElement.objects.filter(user=request.user).order_by('uploaded_at')
    grouped_photos = {}

    for photo in photos:
        date = photo.uploaded_at.date()
        if date not in grouped_photos:
            grouped_photos[date] = {'date': date, 'photos': []}
        grouped_photos[date]['photos'].append(PhotoElementSerializer(photo).data)

    # Sort the grouped photos by date 
    grouped_photos = sorted(grouped_photos.values(), key=lambda x: x['date'], reverse=True)
    
    return Response(grouped_photos, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_album(request):
    serializer = AlbumSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_albums(request):
    albums = Album.objects.filter(user=request.user)
    serializer = AlbumSerializer(albums, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_album_photos(request, album_id):
    album = get_object_or_404(Album, id=album_id, user=request.user)
    photos = album.photos.all()
    serializer = PhotoElementSerializer(photos, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
