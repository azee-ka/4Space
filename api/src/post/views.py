from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ThreadPost, VisualPost, PollPost, StoryPost, EventPost, AudioPost
from .serializers import PostCreateSerializer, ThreadPostSerializer, VisualPostSerializer, PollPostSerializer, StoryPostSerializer, EventPostSerializer, AudioPostSerializer
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

# POST creation view (already covered)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    serializer = PostCreateSerializer(data=request.data, context={'request': request})  # Pass the request in context
    if serializer.is_valid():
        post = serializer.save()
        
        # Use the appropriate serializer for the response
        if isinstance(post, ThreadPost):
            response_serializer = ThreadPostSerializer(post)
            post_type = 'Thread'
        elif isinstance(post, VisualPost):
            response_serializer = VisualPostSerializer(post)
            post_type = 'Visual'
        elif isinstance(post, PollPost):
            response_serializer = PollPostSerializer(post)
            post_type = 'Poll'
        elif isinstance(post, StoryPost):
            response_serializer = StoryPostSerializer(post)
            post_type = 'Story'
        elif isinstance(post, EventPost):
            response_serializer = EventPostSerializer(post)
            post_type = 'Event'
        elif isinstance(post, AudioPost):
            response_serializer = AudioPostSerializer(post)
            post_type = 'Audio'
        else:
            return Response({"error": "Unknown post type"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Add the `post_type` field dynamically to the response data
        response_data = response_serializer.data
        response_data['post_type'] = post_type
        return Response(response_data, status=status.HTTP_201_CREATED)
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
