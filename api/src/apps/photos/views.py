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
    photos = PhotoElement.objects.filter(user=request.user.interactuser).order_by('original_media_datetime')
    grouped_photos = {}

    for photo in photos:
        date = photo.original_media_datetime.date()
        if date not in grouped_photos:
            grouped_photos[date] = {'date': date, 'photos': []}
        grouped_photos[date]['photos'].append(PhotoElementSerializer(photo).data)

    # Sort the grouped photos by date 
    grouped_photos = sorted(grouped_photos.values(), key=lambda x: x['date'], reverse=True)
    
    return Response(grouped_photos, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_album(request):
    # No input data needed, so directly create the album data dictionary
    album_data = {
        'name': "Untitled Album",
        'description': ""
    }

    serializer = AlbumSerializer(data=album_data)
    if serializer.is_valid():
        # Save the album and explicitly set the user
        album = serializer.save(user=request.user.interactuser)
        return Response({'id': album.id}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_albums(request):
    albums = Album.objects.filter(user=request.user.interactuser)
    serializer = AlbumSerializer(albums, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_album_photos(request, album_id):
    album = get_object_or_404(Album, id=album_id, user=request.user.interactuser)
    photos = album.photos.all()
    serializer = PhotoElementSerializer(photos, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_album_metadata(request, album_id):
    # Retrieve the album using the provided album_id
    album = get_object_or_404(Album, id=album_id, user=request.user.interactuser)
    
    # Serialize the album data
    serializer = AlbumSerializer(album)
    
    # Return the serialized data in the response
    return Response(serializer.data, status=status.HTTP_200_OK)




@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_album_title(request, album_id):
    album = get_object_or_404(Album, id=album_id, user=request.user.interactuser)

    new_title = request.data.get('title', None)
    if new_title is not None:
        album.name = new_title
        album.save()
        return Response({'message': 'Album title updated successfully'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'New title not provided'}, status=status.HTTP_400_BAD_REQUEST)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_photos_to_album(request, album_id):
    try:
        # Check if the album belongs to the user
        album = request.user.interactuser.albums.get(pk=album_id)
    except Album.DoesNotExist:
        return Response({'error': 'Album not found'}, status=status.HTTP_404_NOT_FOUND)

    if 'photos' not in request.FILES:
        return Response({'error': 'No photos provided'}, status=status.HTTP_400_BAD_REQUEST)

    photos = request.FILES.getlist('photos')

    for index, photo in photos:
        photo_element = PhotoElement.objects.create(user=request.user.interactuser, album=album, file=photo, media_type='image')
        # Save the photo_element to extract and set actual_datetime
        photo_element.save()
        
        # Set thumbnail for the album if it's the first photo uploaded
        if index == 0 and not album.thumbnail:
            album.thumbnail = photo
            album.save()

    return Response({'message': 'Photos uploaded successfully'}, status=status.HTTP_201_CREATED)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_album(request, album_id):
    album = get_object_or_404(Album, id=album_id, user=request.user)
    album.delete()
    return Response({'message': 'Album deleted successfully'}, status=status.HTTP_204_NO_CONTENT)