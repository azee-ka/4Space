from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import ThreadPost, VisualPost
from ..serializers import MinimalThreadPostSerializer, MinimalVisualPostSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def timeline_posts(request):
    """
    Timeline view showing posts only from users the current user is following.
    """
    user = request.user

    following_users = user.following.all()  # Get all users the current user follows

    # Get posts authored by those users
    thread_posts = ThreadPost.objects.filter(author__in=following_users)
    visual_posts = VisualPost.objects.filter(author__in=following_users)

    posts = list(thread_posts) + list(visual_posts)
    posts.sort(key=lambda x: x.created_at, reverse=True)  # Newest first

    serialized_posts = []
    for post in posts:
        if isinstance(post, ThreadPost):
            serializer = MinimalThreadPostSerializer(post, context={'request': request})
        elif isinstance(post, VisualPost):
            serializer = MinimalVisualPostSerializer(post, context={'request': request})
        serialized_posts.append(serializer.data)

    return Response({'posts': serialized_posts})
