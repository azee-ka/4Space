from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ThreadPost, VisualPost, PollPost, StoryPost, EventPost, AudioPost
from .serializers import PostCreateSerializer, ThreadPostSerializer, VisualPostSerializer, PollPostSerializer, StoryPostSerializer, EventPostSerializer, AudioPostSerializer, POST_TYPE_REGISTRY
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

# POST creation view (already covered)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    serializer = PostCreateSerializer(data=request.data, context={'request': request})  # Pass the request in context
    if serializer.is_valid():
        post = serializer.save()
        
        if isinstance(post, VisualPost) and post.media_files.count() == 0:
            post.delete()  # Clean up the wrong post
            return Response({"error": "Visual posts must contain at least one media file."}, status=status.HTTP_400_BAD_REQUEST)
        
        post_type = post.__class__.__name__.replace('Post', '')
        serializer_class = POST_TYPE_REGISTRY.get(post_type)
        if not serializer_class:
            return Response({"error": "Unregistered post type"}, status=400)

        response_data = serializer_class(post, context={'request': request}).data
        response_data['post_type'] = post_type
        return Response(response_data, status=201)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Retrieve all posts (could be used for feed or explore)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_posts(request):
    # Fetch posts from all models
    thread_posts = ThreadPost.objects.all()
    visual_posts = VisualPost.objects.all()
    poll_posts = PollPost.objects.all()
    story_posts = StoryPost.objects.all()
    event_posts = EventPost.objects.all()
    audio_posts = AudioPost.objects.all()

    # Serialize all posts
    serialized_posts = []
    for post in thread_posts:
        serialized_posts.append(ThreadPostSerializer(post).data)
    for post in visual_posts:
        serialized_posts.append(VisualPostSerializer(post).data)
    for post in poll_posts:
        serialized_posts.append(PollPostSerializer(post).data)
    for post in story_posts:
        serialized_posts.append(StoryPostSerializer(post).data)
    for post in event_posts:
        serialized_posts.append(EventPostSerializer(post).data)
    for post in audio_posts:
        serialized_posts.append(AudioPostSerializer(post).data)

    # Sort posts by creation date, treating None as the earliest possible date
    serialized_posts.sort(key=lambda x: x.get('created_at') or '', reverse=True)

    return Response(serialized_posts, status=status.HTTP_200_OK)

# Retrieve a single post by its UUID
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_post_by_id(request, post_id):
    post = get_object_or_404(ThreadPost, id=post_id) or \
           get_object_or_404(VisualPost, id=post_id) or \
           get_object_or_404(PollPost, id=post_id) or \
           get_object_or_404(StoryPost, id=post_id) or \
           get_object_or_404(EventPost, id=post_id) or \
           get_object_or_404(AudioPost, id=post_id)

    # Serialize the post according to its type
    if isinstance(post, ThreadPost):
        return Response(ThreadPostSerializer(post).data, status=status.HTTP_200_OK)
    elif isinstance(post, VisualPost):
        return Response(VisualPostSerializer(post).data, status=status.HTTP_200_OK)
    elif isinstance(post, PollPost):
        return Response(PollPostSerializer(post).data, status=status.HTTP_200_OK)
    elif isinstance(post, StoryPost):
        return Response(StoryPostSerializer(post).data, status=status.HTTP_200_OK)
    elif isinstance(post, EventPost):
        return Response(EventPostSerializer(post).data, status=status.HTTP_200_OK)
    elif isinstance(post, AudioPost):
        return Response(AudioPostSerializer(post).data, status=status.HTTP_200_OK)

# Update a post by its UUID
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_post(request, post_id):
    # Find the post based on its UUID
    post = get_object_or_404(ThreadPost, id=post_id) or \
           get_object_or_404(VisualPost, id=post_id) or \
           get_object_or_404(PollPost, id=post_id) or \
           get_object_or_404(StoryPost, id=post_id) or \
           get_object_or_404(EventPost, id=post_id) or \
           get_object_or_404(AudioPost, id=post_id)

    # Depending on the post type, use the appropriate serializer
    if isinstance(post, ThreadPost):
        serializer = ThreadPostSerializer(post, data=request.data, partial=True)
    elif isinstance(post, VisualPost):
        serializer = VisualPostSerializer(post, data=request.data, partial=True)
    elif isinstance(post, PollPost):
        serializer = PollPostSerializer(post, data=request.data, partial=True)
    elif isinstance(post, StoryPost):
        serializer = StoryPostSerializer(post, data=request.data, partial=True)
    elif isinstance(post, EventPost):
        serializer = EventPostSerializer(post, data=request.data, partial=True)
    elif isinstance(post, AudioPost):
        serializer = AudioPostSerializer(post, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete a post by its UUID
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    post = get_object_or_404(ThreadPost, id=post_id) or \
           get_object_or_404(VisualPost, id=post_id) or \
           get_object_or_404(PollPost, id=post_id) or \
           get_object_or_404(StoryPost, id=post_id) or \
           get_object_or_404(EventPost, id=post_id) or \
           get_object_or_404(AudioPost, id=post_id)
    post.delete()
    return Response({"message": "Post deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

# Retrieve posts of a specific type (example: Polls, Threads, etc.)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_posts_by_type(request, post_type):
    if post_type == "Thread":
        posts = ThreadPost.objects.all()
        serializer = ThreadPostSerializer(posts, many=True)
    elif post_type == "Visual":
        posts = VisualPost.objects.all()
        serializer = VisualPostSerializer(posts, many=True)
    elif post_type == "Poll":
        posts = PollPost.objects.all()
        serializer = PollPostSerializer(posts, many=True)
    elif post_type == "Story":
        posts = StoryPost.objects.all()
        serializer = StoryPostSerializer(posts, many=True)
    elif post_type == "Event":
        posts = EventPost.objects.all()
        serializer = EventPostSerializer(posts, many=True)
    elif post_type == "Audio":
        posts = AudioPost.objects.all()
        serializer = AudioPostSerializer(posts, many=True)
    else:
        return Response({"error": "Invalid post type"}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serializer.data, status=status.HTTP_200_OK)











# View for Creating a Reply to a Comment
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_reply(request, comment_id):
    parent_comment = get_object_or_404(Comment, id=comment_id)
    serializer = CommentSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save(author=request.user, parent_comment=parent_comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    user = request.user

    # Get the vote type from the request
    vote_type = request.data.get('vote_type')

    if vote_type not in ['upvote', 'downvote']:
        return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)

    # Check for any existing vote by the user on the comment
    existing_vote = Vote.objects.filter(user=user, comment=comment).first()

    if existing_vote:
        # If the user has already voted, and the vote type is the same, remove the existing vote
        if existing_vote.vote_type == vote_type:
            try:
                # Remove the existing vote (same vote type clicked again)
                existing_vote.delete()
                # Get the updated vote counts
                upvotes_count = Vote.objects.filter(comment=comment, vote_type='upvote').count()
                downvotes_count = Vote.objects.filter(comment=comment, vote_type='downvote').count()
                return Response({
                    'message': f'{vote_type.capitalize()} removed successfully',
                    'upvotes_count': upvotes_count,
                    'downvotes_count': downvotes_count,
                    'vote_status': 'none',
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': f'Error removing {vote_type}: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # If the vote type is different, remove the previous vote and add the new one
            try:
                # Remove the previous vote
                existing_vote.delete()

                # Create the new vote
                Vote.objects.create(user=user, comment=comment, vote_type=vote_type)

                # Get the updated vote counts
                upvotes_count = Vote.objects.filter(comment=comment, vote_type='upvote').count()
                downvotes_count = Vote.objects.filter(comment=comment, vote_type='downvote').count()

                return Response({
                    'message': f'{vote_type.capitalize()}d successfully, previous vote removed',
                    'upvotes_count': upvotes_count,
                    'downvotes_count': downvotes_count,
                    'vote_status': f'{vote_type}d',
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': f'Error processing the vote: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    else:
        # If no existing vote, create a new vote
        try:
            Vote.objects.create(user=user, comment=comment, vote_type=vote_type)

            # Get the updated vote counts
            upvotes_count = Vote.objects.filter(comment=comment, vote_type='upvote').count()
            downvotes_count = Vote.objects.filter(comment=comment, vote_type='downvote').count()

            return Response({
                'message': f'{vote_type.capitalize()}d successfully',
                'upvotes_count': upvotes_count,
                'downvotes_count': downvotes_count,
                'vote_status': f'{vote_type}d',
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Error creating {vote_type}: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    user = request.user

    # Check if the user has already liked the comment
    if user in comment.likes.all():
        # Remove the like (DELETE logic)
        try:
            comment.likes.remove(user)
            comment.update_like_count()  # Ensure like count is updated
            return Response({
                'message': 'Like removed successfully',
                'likes_count': comment.likes_count,
                'like_status': 'not_liked',
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    else:
        # Add the like (POST logic)
        try:
            comment.likes.add(user)
            comment.update_like_count()  # Ensure like count is updated
            return Response({
                'message': 'Comment liked successfully',
                'likes_count': comment.likes_count,
                'like_status': 'liked',
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)







@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_flare_by_id(request, flare_id):
    try:
        flare = Flare.objects.get(uuid=flare_id)
        serializer = FlareSerializer(flare, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK) # Use status.HTTP_200_OK
    except Flare.DoesNotExist:
        return Response({'message': 'Flare not found'}, status=status.HTTP_404_NOT_FOUND) # Use status.HTTP_404_NOT_FOUND


@api_view(['POST'])  # Use Flare method for creating comments
@permission_classes([IsAuthenticated])
def create_comment(request, flare_id):
    try:
        flare = Flare.objects.get(uuid=flare_id)
    except Flare.DoesNotExist:
        return Response({'message': 'Flare not found'}, status=status.HTTP_404_NOT_FOUND)

    # Assuming the 'text' for the comment is sent in the request data
    serializer = CommentSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save(author=request.user, flare=flare)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)






@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like_dislike(request, flare_id):
    try:
        flare = Flare.objects.get(uuid=flare_id)
    except Flare.DoesNotExist:
        return Response({'message': 'Flare not found'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    toggle_type = request.data.get('toggle_type')

    if toggle_type not in ['like', 'dislike']:
        return Response({'message': 'Invalid toggle_type. Must be "like" or "dislike".'}, status=status.HTTP_400_BAD_REQUEST)

    # Resetting both statuses to ensure mutual exclusivity
    if toggle_type == 'like':
        if flare.likes.filter(id=user.id).exists():
            flare.likes.remove(user)  # User already liked, so we remove the like
        else:
            flare.likes.add(user)  # Add like
            flare.dislikes.remove(user)  # Ensure dislike is removed if it exists
    elif toggle_type == 'dislike':
        if flare.dislikes.filter(id=user.id).exists():
            flare.dislikes.remove(user)  # User already disliked, so we remove the dislike
        else:
            flare.dislikes.add(user)  # Add dislike
            flare.likes.remove(user)  # Ensure like is removed if it exists

    flare.save()

    # Get updated counts
    like_count = flare.likes.count()
    dislike_count = flare.dislikes.count()
    user_has_liked = flare.likes.filter(id=user.id).exists()
    user_has_disliked = flare.dislikes.filter(id=user.id).exists()

    return Response({
        'likes_count': like_count,
        'dislikes_count': dislike_count,
        'like_status': 'liked' if user_has_liked else 'not_liked',
        'dislike_status': 'disliked' if user_has_disliked else 'not_disliked',
    }, status=status.HTTP_200_OK)








@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_flare(request, flare_id):
    try:
        flare = Flare.objects.get(uuid=flare_id)
    except Flare.DoesNotExist:
        return Response({'error': 'Flare not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if the current user is the owner of the Flare
    if request.user == flare.user:
        Flare.delete()
        return Response({'success': True, 'message': 'Flare deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    else:
        return Response({'error': 'You do not have permission to delete this Flare'}, status=status.HTTP_403_FORBIDDEN)

