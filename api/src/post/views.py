from rest_framework.decorators import api_view, permission_classes
from django.contrib.contenttypes.models import ContentType
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import ThreadPost, VisualPost, Vote, Comment
from .serializers import (
    PostCreateSerializer,
    ThreadPostSerializer,
    VisualPostSerializer,
    VoteSerializer,
    CommentSerializer
)

# POST creation view
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    serializer = PostCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        post = serializer.save()

        # If it's a VisualPost, ensure it has media
        if isinstance(post, VisualPost) and post.media_files.count() == 0:
            post.delete()
            return Response({"error": "Visual posts must contain at least one media file."}, status=status.HTTP_400_BAD_REQUEST)

        if isinstance(post, ThreadPost):
            response_serializer = ThreadPostSerializer(post, context={'request': request})
        elif isinstance(post, VisualPost):
            response_serializer = VisualPostSerializer(post, context={'request': request})
        else:
            return Response({"error": "Unknown post type created."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Retrieve all posts (Explore/Feed)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_posts(request):
    thread_posts = ThreadPost.objects.all()
    visual_posts = VisualPost.objects.all()

    serialized_posts = []

    for post in thread_posts:
        serialized_posts.append(ThreadPostSerializer(post, context={'request': request}).data)

    for post in visual_posts:
        serialized_posts.append(VisualPostSerializer(post, context={'request': request}).data)

    serialized_posts.sort(key=lambda x: x.get('created_at') or '', reverse=True)

    return Response(serialized_posts, status=status.HTTP_200_OK)


# Retrieve a single post by UUID
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_post_by_id(request, post_id):
    post = None
    try:
        post = ThreadPost.objects.get(id=post_id)
        serializer = ThreadPostSerializer(post, context={'request': request})
    except ThreadPost.DoesNotExist:
        try:
            post = VisualPost.objects.get(id=post_id)
            serializer = VisualPostSerializer(post, context={'request': request})
        except VisualPost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response(serializer.data, status=status.HTTP_200_OK)


# Update a post by UUID
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_post(request, post_id):
    try:
        post = ThreadPost.objects.get(id=post_id)
        serializer = ThreadPostSerializer(post, data=request.data, partial=True, context={'request': request})
    except ThreadPost.DoesNotExist:
        try:
            post = VisualPost.objects.get(id=post_id)
            serializer = VisualPostSerializer(post, data=request.data, partial=True, context={'request': request})
        except VisualPost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Delete a post by UUID
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    try:
        post = ThreadPost.objects.get(id=post_id)
    except ThreadPost.DoesNotExist:
        try:
            post = VisualPost.objects.get(id=post_id)
        except VisualPost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    post.delete()
    return Response({"message": "Post deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


# Retrieve posts filtered by type
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_posts_by_type(request, post_type):
    if post_type == "Thread":
        posts = ThreadPost.objects.all()
        serializer = ThreadPostSerializer(posts, many=True, context={'request': request})
    elif post_type == "Visual":
        posts = VisualPost.objects.all()
        serializer = VisualPostSerializer(posts, many=True, context={'request': request})
    else:
        return Response({"error": "Invalid post type"}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serializer.data, status=status.HTTP_200_OK)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like_dislike(request, post_id):
    post = None
    try:
        post = ThreadPost.objects.get(id=post_id)
    except ThreadPost.DoesNotExist:
        try:
            post = VisualPost.objects.get(id=post_id)
        except VisualPost.DoesNotExist:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    toggle_type = request.data.get('toggle_type')

    if toggle_type not in ['like', 'dislike']:
        return Response({'error': 'Invalid toggle_type. Must be "like" or "dislike".'}, status=status.HTTP_400_BAD_REQUEST)

    if toggle_type == 'like':
        if post.likes.filter(id=user.id).exists():
            post.likes.remove(user)  # Remove existing like
        else:
            post.likes.add(user)
            post.dislikes.remove(user)  # Ensure no dislike exists
    elif toggle_type == 'dislike':
        if post.dislikes.filter(id=user.id).exists():
            post.dislikes.remove(user)  # Remove existing dislike
        else:
            post.dislikes.add(user)
            post.likes.remove(user)  # Ensure no like exists

    post.save()

    return Response({
        'likes_count': post.likes.count(),
        'dislikes_count': post.dislikes.count(),
        'like_status': 'liked' if post.likes.filter(id=user.id).exists() else 'not_liked',
        'dislike_status': 'disliked' if post.dislikes.filter(id=user.id).exists() else 'not_disliked',
    }, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    # Lookup for any post
    post = None
    try:
        post = ThreadPost.objects.get(id=post_id)
    except ThreadPost.DoesNotExist:
        try:
            post = VisualPost.objects.get(id=post_id)
        except VisualPost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = CommentSerializer(data=request.data, context={'request': request, 'post': post})
    if serializer.is_valid():
        comment = serializer.save()
        return Response(CommentSerializer(comment, context={'request': request}).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_reply(request, comment_id):
    parent_comment = get_object_or_404(Comment, id=comment_id)
    serializer = CommentSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        comment = serializer.save(author=request.user)
        comment.content_type = parent_comment.content_type
        comment.object_id = parent_comment.object_id
        comment.parent_comment = parent_comment
        comment.save()
        return Response(CommentSerializer(comment, context={'request': request}).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    user = request.user
    vote_type = request.data.get('vote_type')

    if vote_type not in ['upvote', 'downvote']:
        return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)

    existing_vote = Vote.objects.filter(user=user, comment=comment).first()

    if existing_vote:
        if existing_vote.vote_type == vote_type:
            existing_vote.delete()
            message = f"{vote_type} removed."
            vote_status = "none"
        else:
            existing_vote.delete()
            Vote.objects.create(user=user, comment=comment, vote_type=vote_type)
            message = f"Changed to {vote_type}."
            vote_status = f"{vote_type}d"
    else:
        Vote.objects.create(user=user, comment=comment, vote_type=vote_type)
        message = f"{vote_type}d successfully."
        vote_status = f"{vote_type}d"

    return Response({
        'message': message,
        'upvotes_count': Vote.upvotes(comment).count(),
        'downvotes_count': Vote.downvotes(comment).count(),
        'vote_status': vote_status,
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    user = request.user

    if user in comment.likes.all():
        comment.likes.remove(user)
        comment.update_like_count()
        like_status = "not_liked"
    else:
        comment.likes.add(user)
        comment.update_like_count()
        like_status = "liked"

    return Response({
        'message': f"Comment {like_status.replace('_', ' ')} successfully.",
        'likes_count': comment.likes_count,
        'like_status': like_status,
    }, status=status.HTTP_200_OK)
