from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Post, MediaFile
from ..serializers import PostSerializer
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    serializer = PostSerializer(data=request.data)
    if serializer.is_valid():
        if request.user.is_authenticated:
            # Create a new post
            post = serializer.save(user=request.user, id=uuid.uuid4())

            # Handle multiple media files
            media_files = request.FILES.getlist('media[]')
            print("Received media files:", media_files)
            for media_file in media_files:
                media_type = media_file.name.split('.')[-1]
                media = MediaFile.objects.create(file=media_file, media_type=media_type)
                post.media_files.add(media)

            post.save()

            # Associate the new post with the user's my_posts field
            request.user.interactuser.posts.add(post)

            # Include the username in the response data
            serialized_data = serializer.data
            serialized_data['id'] = str(post.id)
            serialized_data['username'] = request.user.username  # Add username to the response

            return Response(serialized_data, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'User is not authenticated.'}, status=status.HTTP_401_UNAUTHORIZED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
