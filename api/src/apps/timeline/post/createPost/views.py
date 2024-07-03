from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Post, MediaFile, Comment
from ..serializers import PostSerializer
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    serializer = PostSerializer(data=request.data)
    if serializer.is_valid():
        if request.user.is_authenticated:
            # Create a new post
            post = serializer.save(user=request.user.interactuser.timeline_user, id=uuid.uuid4())

            # Handle caption as a comment
            caption = request.data.get('caption')
            if caption or len(caption) > 0:
                # Ensure the post caption is set
                post.caption = caption
                post.save()
                # Create the caption comment and add it to the post with order=0
                caption_comment = Comment.objects.create(post=post, user=request.user.interactuser.timeline_user, text=caption)
                # post.comments.add(caption_comment, bulk=False)  # Ensure it's added first

                
            # Handle multiple media files
            media_files = request.FILES.getlist('media[]')
            print("Received media files:", media_files)
            for media_file in media_files:
                media_type = media_file.name.split('.')[-1]
                media = MediaFile.objects.create(file=media_file, media_type=media_type)
                post.media_files.add(media)

            post.save()

            # Associate the new post with the user's my_posts field
            request.user.interactuser.timeline_user.posts.add(post)

            # Include the username in the response data
            serialized_data = serializer.data
            serialized_data['id'] = str(post.id)
            serialized_data['username'] = request.user.username  # Add username to the response

            return Response(serialized_data, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'User is not authenticated.'}, status=status.HTTP_401_UNAUTHORIZED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
