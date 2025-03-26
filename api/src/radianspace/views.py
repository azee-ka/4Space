from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.generics import RetrieveAPIView, CreateAPIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Flare, Comment, MediaFile, Vote
from .serializers import FlareSerializer, CommentSerializer
import uuid
from django.shortcuts import get_object_or_404

class FlareListCreateView(generics.ListCreateAPIView):
    queryset = Flare.objects.all()
    serializer_class = FlareSerializer
    
class FlareRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Flare.objects.all()
    serializer_class = FlareSerializer

class CreateCommentView(CreateAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer




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









@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_flare(request):
    serializer = FlareSerializer(data=request.data)
    user = request.user
    if serializer.is_valid():
        if user.is_authenticated:
            # Create a new Flare
            flare = serializer.save(author=user, uuid=uuid.uuid4())

            # Handle multiple media files
            media_files = request.FILES.getlist('media[]')
            for media_file in media_files:
                media = MediaFile.objects.create(file=media_file)
                flare.media_files.add(media)

            flare.save()

            return Response({'uuid': flare.uuid}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'User is not authenticated.'}, status=status.HTTP_401_UNAUTHORIZED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)






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

