# # api/time_line/expandPost/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Post
from ..serializers import PostSerializer, CommentSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_post_by_id(request, post_id):

    try:
        post = Post.objects.get(id=post_id)
        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_200_OK) # Use status.HTTP_200_OK
    except Post.DoesNotExist:
        return Response({'message': 'Post not found'}, status=status.HTTP_404_NOT_FOUND) # Use status.HTTP_404_NOT_FOUND


@api_view(['POST'])  # Use POST method for creating comments
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'message': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    # Assuming the 'text' for the comment is sent in the request data
    serializer = CommentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user, post=post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def create_like(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'message': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user

    if request.method == 'POST':
        # Check if the user has already disliked the post, and remove the dislike
        if user in post.dislikes.all():
            post.dislikes.remove(user)

        # Check if the user is already in the list of likers
        if user not in post.likes.all():
            # Like the post
            post.likes.add(user)

    elif request.method == 'DELETE':
        # Unlike the post
        post.likes.remove(user)

    post.save()

    serializer = PostSerializer(post)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def create_dislike(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'message': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user

    if request.method == 'POST':
        # Check if the user has already liked the post, and remove the like
        if user in post.likes.all():
            post.likes.remove(user)

        # Check if the user is already in the list of dislikers
        if user not in post.dislikes.all():
            # Dislike the post
            post.dislikes.add(user)

    elif request.method == 'DELETE':
        # Remove the dislike
        post.dislikes.remove(user)

    post.save()

    serializer = PostSerializer(post)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if the current user is the owner of the post
    if request.user == post.user:
        post.delete()
        return Response({'success': True, 'message': 'Post deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    else:
        return Response({'error': 'You do not have permission to delete this post'}, status=status.HTTP_403_FORBIDDEN)
