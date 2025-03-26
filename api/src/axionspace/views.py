from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Exchange, Entry, Comment, Score, Flag, ImpactScore, ExchangeMember, ExchangeVote, EntryVote, CommentVote
from .serializers import ExchangeSerializer, MinimalExchangeSerializer, EntrySerializer, CommentSerializer, ScoreSerializer, FlagSerializer, ImpactScoreSerializer
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import IntegrityError
from rest_framework import status
from ..user.models import BaseUser



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_comment(request, comment_id):
    try:
        # Retrieve the comment
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({"error": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

    # Get vote type from request data
    vote_type = request.data.get('vote_type')
    if vote_type not in ['upvote', 'downvote']:
        return Response({"error": "Invalid vote type."}, status=status.HTTP_400_BAD_REQUEST)

    # Check if the user has already voted on this comment
    existing_vote = CommentVote.objects.filter(user=request.user, comment=comment).first()

    if existing_vote:
        if existing_vote.vote_type == vote_type:
            # User wants to remove their existing vote
            existing_vote.delete()
        else:
            # User wants to change their vote
            existing_vote.vote_type = vote_type
            existing_vote.save()
    else:
        # Create a new vote
        CommentVote.objects.create(user=request.user, comment=comment, vote_type=vote_type)

    # Calculate updated vote counts
    upvotes = CommentVote.objects.filter(comment=comment, vote_type='upvote').count()
    downvotes = CommentVote.objects.filter(comment=comment, vote_type='downvote').count()
    net_votes = upvotes - downvotes

    # Return only vote counts
    return Response({
        "upvotes": upvotes,
        "downvotes": downvotes,
        "net_votes": net_votes
    }, status=status.HTTP_200_OK)
    


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reply_to_comment(request, comment_id):
    """
    Reply to a specific comment.
    """
    try:
        parent_comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({"error": "Parent comment not found."}, status=status.HTTP_404_NOT_FOUND)

    # Get the reply content from the request body
    content = request.data.get('content')

    if not content:
        return Response({"error": "Reply content is required."}, status=status.HTTP_400_BAD_REQUEST)

    # Create the reply instance
    reply = Comment.objects.create(
        content=content,
        entry=parent_comment.entry,
        author=request.user,
        parent_comment=parent_comment
    )

    # Serialize the created reply to return in the response
    serializer = CommentSerializer(reply)

    return Response({
        "message": "Reply created successfully.",
        "reply": serializer.data
    }, status=status.HTTP_201_CREATED)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_comment(request, entry_uuid):
    """
    Create a comment for a specific entry.
    The user must be authenticated.
    """
    try:
        # Retrieve the entry object based on the provided UUID
        entry = Entry.objects.get(uuid=entry_uuid)
    except Entry.DoesNotExist:
        return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)

    # Get the comment content from the request body
    content = request.data.get('content')

    if not content:
        return Response({"error": "Comment content is required."}, status=status.HTTP_400_BAD_REQUEST)

    # Create the comment instance
    comment = Comment.objects.create(
        content=content,
        entry=entry,
        author=request.user
    )

    # Serialize the created comment to return in the response
    serializer = CommentSerializer(comment)

    # Return the created comment along with a success message
    return Response({
        "message": "Comment created successfully.",
        "comment": serializer.data
    }, status=status.HTTP_201_CREATED)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_exchange(request, exchange_uuid):
    try:
        # Retrieve the exchange
        exchange = Exchange.objects.get(uuid=exchange_uuid)
    except Exchange.DoesNotExist:
        return Response({"error": "Exchange not found."}, status=404)

    # Get vote_type from request data
    vote_type = request.data.get('vote_type')
    if vote_type not in ['upvote', 'downvote']:
        return Response({"error": "Invalid vote type."}, status=400)

    # Check if the user has already voted on this exchange
    existing_vote = ExchangeVote.objects.filter(user=request.user, exchange=exchange).first()

    if existing_vote:
        if existing_vote.vote_type == vote_type:
            # If the same vote type is clicked again, delete the vote
            existing_vote.delete()
            message = "Your vote has been removed."
        else:
            # Change the existing vote
            existing_vote.vote_type = vote_type
            existing_vote.save()
            message = "Your vote has been updated."
    else:
        # Create a new vote record
        ExchangeVote.objects.create(user=request.user, exchange=exchange, vote_type=vote_type)
        message = "Your vote has been registered."

    # Update vote counts
    exchange.upvotes = ExchangeVote.objects.filter(exchange=exchange, vote_type='upvote').count()
    exchange.downvotes = ExchangeVote.objects.filter(exchange=exchange, vote_type='downvote').count()
    exchange.net_votes = exchange.upvotes - exchange.downvotes
    exchange.save()

    # Return updated exchange data
    return Response({
        "message": message,
        "upvotes": exchange.upvotes,
        "downvotes": exchange.downvotes,
        "net_votes": exchange.net_votes
    }, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_entry(request, entry_uuid):
    try:
        # Retrieve the entry
        entry = Entry.objects.get(uuid=entry_uuid)
    except Entry.DoesNotExist:
        return Response({"error": "Entry not found."}, status=404)

    # Get vote_type from request data
    vote_type = request.data.get('vote_type')

    if vote_type not in ['upvote', 'downvote']:
        return Response({"error": "Invalid vote type."}, status=400)

    # Check if the user has already voted on this entry
    existing_vote = EntryVote.objects.filter(user=request.user, entry=entry).first()

    if existing_vote:
        if existing_vote.vote_type == vote_type:
            # If the same vote type is clicked again, delete the vote
            existing_vote.delete()
            message = "Your vote has been removed."
        else:
            # Change the existing vote
            existing_vote.vote_type = vote_type
            existing_vote.save()
            message = "Your vote has been updated."
    else:
        # Create a new vote record
        EntryVote.objects.create(user=request.user, entry=entry, vote_type=vote_type)
        message = "Your vote has been registered."

    # Update vote counts
    entry.upvotes = EntryVote.objects.filter(entry=entry, vote_type='upvote').count()
    entry.downvotes = EntryVote.objects.filter(entry=entry, vote_type='downvote').count()
    entry.net_votes = entry.upvotes - entry.downvotes
    entry.save()

    # Return the updated vote counts and net votes
    return Response({
        "message": message,
        "upvotes": entry.upvotes,
        "downvotes": entry.downvotes,
        "net_votes": entry.net_votes
    }, status=200)

        
        

# Create Exchange View
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_exchange(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        # Pass the request context to the serializer
        serializer = ExchangeSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            exchange = serializer.save(creator=request.user)  # Set creator to the logged-in user
            return Response({"uuid": exchange.uuid}, status=status.HTTP_201_CREATED)
        
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Exchange List View
@api_view(['GET', 'POST'])
def exchange_list(request):
    if request.method == 'GET':
        exchanges = Exchange.objects.all()
        serializer = ExchangeSerializer(exchanges, many=True)
        return Response(serializer.data)

# Exchange Detail View
@api_view(['GET', 'PUT', 'DELETE'])
def exchange_detail(request, exchange_id):
    exchange = get_object_or_404(Exchange, uuid=exchange_id)

    if request.method == 'GET':
        serializer = ExchangeSerializer(exchange)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ExchangeSerializer(exchange, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        exchange.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@api_view(['GET'])
def minimal_exchange_detail(request, exchange_id):
    exchange = get_object_or_404(Exchange, uuid=exchange_id)
    
    if request.method == 'GET':
        serializer = MinimalExchangeSerializer(exchange)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Entry List View
@api_view(['GET', 'POST'])
def entry_list(request, exchange_id):
    exchange = get_object_or_404(Exchange, uuid=exchange_id)

    if request.method == 'GET':
        entries = Entry.objects.filter(exchange=exchange)
        serializer = EntrySerializer(entries, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = EntrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(exchange=exchange, author=request.user)
            exchange.total_entries += 1  # Correct field name
            exchange.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_entry(request, uuid):
    exchange = get_object_or_404(Exchange, uuid=uuid)

    # Parse request data for file handling
    parser_classes = [MultiPartParser, FormParser]
    
    # Get text and files from the request
    text = request.data.get('text', '')
    title = request.data.get('title', '')
    uploaded_files = request.FILES.getlist('uploadedFiles', [])

    if not text and not uploaded_files:
        print(text)
        return Response({"error": "At least one of 'text', or 'uploadedFiles' must be provided."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Handle saving files to the appropriate directory
    saved_uploaded_files = []

    try:
        for file in uploaded_files:
            path = default_storage.save(f"exchange_files/{uuid}/{file.name}", ContentFile(file.read()))
            saved_uploaded_files.append(path)

        # Create the Entry object
        entry = Entry.objects.create(
            exchange=exchange,
            author=request.user,
            title=title,
            content=text
        )

        # Optionally attach file paths to the entry
        entry.uploaded_files = saved_uploaded_files  # Assume uploaded_files is a JSONField or similar
        entry.save()

        # Update exchange metrics
        exchange.total_entries += 1
        exchange.save()

        return Response({"message": "Entry created successfully", "entry_uuid": entry.uuid}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    


# Entry Detail View
@api_view(['GET', 'PUT', 'DELETE'])
def entry_detail(request, entry_id):
    entry = get_object_or_404(Entry, uuid=entry_id)
    exchange = entry.exchange

    if request.method == 'GET':
        serializer = EntrySerializer(entry)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        entry.delete()
        exchange.entries -= 1  # Decrease the entry count in the Exchange model
        exchange.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Comment List View
@api_view(['GET', 'POST'])
def comment_list(request, entry_id):
    entry = get_object_or_404(Entry, pk=entry_id)

    if request.method == 'GET':
        comments = Comment.objects.filter(entry=entry)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(entry=entry, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Score Entry View
@api_view(['POST'])
def score_entry(request, entry_id):
    entry = get_object_or_404(Entry, pk=entry_id)
    score_type = request.data.get('score_type')

    if score_type not in ['upvote', 'downvote']:
        return Response({'error': 'Invalid score type'}, status=status.HTTP_400_BAD_REQUEST)

    score = Score.objects.create(content_type='entry', content_id=entry.id, score_type=score_type)
    # Recalculate the score for the entry
    entry.score += 1 if score_type == 'upvote' else -1
    entry.save()

    # Optionally recalculate ImpactScore if needed
    impact_score = ImpactScore.objects.filter(entry=entry).first()
    if impact_score:
        impact_score.calculate_engagement()

    return Response(ScoreSerializer(score).data, status=status.HTTP_201_CREATED)

# Flag Entry View
@api_view(['POST'])
def flag_entry(request, entry_id):
    entry = get_object_or_404(Entry, pk=entry_id)
    reason = request.data.get('reason')

    if reason not in ['spam', 'inappropriate', 'offensive', 'other']:
        return Response({'error': 'Invalid flag reason'}, status=status.HTTP_400_BAD_REQUEST)

    flag = Flag.objects.create(content_type='entry', content_id=entry.id, reason=reason, user=request.user)

    # Optionally update flagged content count on Exchange
    exchange = entry.exchange
    exchange.flagged_content_count += 1
    exchange.save()

    return Response(FlagSerializer(flag).data, status=status.HTTP_201_CREATED)

# Impact Score View
@api_view(['GET'])
def impact_score_entry(request, entry_id):
    entry = get_object_or_404(Entry, pk=entry_id)
    impact_score = ImpactScore.objects.filter(entry=entry).first()

    if impact_score is None:
        return Response({'error': 'Impact score not calculated yet'}, status=status.HTTP_404_NOT_FOUND)

    return Response(ImpactScoreSerializer(impact_score).data)

# Add Members to Exchange
@api_view(['POST'])
def add_members(request, exchange_id):
    exchange = get_object_or_404(Exchange, pk=exchange_id)

    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    if not request.data.get('members'):
        return Response({"detail": "No members provided."}, status=status.HTTP_400_BAD_REQUEST)

    member_ids = request.data.get('members', [])
    members = BaseUser.objects.filter(id__in=member_ids)

    if not members.exists():
        return Response({"detail": "One or more users do not exist."}, status=status.HTTP_404_NOT_FOUND)

    for member in members:
        ExchangeMember.objects.get_or_create(user=member, exchange=exchange)  # Track members

    exchange.members += len(members)  # Update member count
    exchange.save()

    return Response({"detail": "Members added successfully."}, status=status.HTTP_200_OK)

# Add Moderators to Exchange
@api_view(['POST'])
def add_moderators(request, exchange_id):
    exchange = get_object_or_404(Exchange, pk=exchange_id)

    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    if not request.data.get('moderators'):
        return Response({"detail": "No moderators provided."}, status=status.HTTP_400_BAD_REQUEST)

    moderator_ids = request.data.get('moderators', [])
    moderators = BaseUser.objects.filter(id__in=moderator_ids)

    if not moderators.exists():
        return Response({"detail": "One or more users do not exist."}, status=status.HTTP_404_NOT_FOUND)

    exchange.moderators.add(*moderators)  # Add moderators
    return Response({"detail": "Moderators added successfully."}, status=status.HTTP_200_OK)
