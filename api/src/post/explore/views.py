from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from ..models import ThreadPost, VisualPost, PollPost, StoryPost, EventPost, AudioPost
from ..serializers import (
    ThreadPostSerializer, VisualPostSerializer, PollPostSerializer,
    StoryPostSerializer, EventPostSerializer, AudioPostSerializer
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore_posts(request):
    """
    Return all public posts from all types, tagged with their type.
    """

    # Map models to their serializers
    post_types = {
        ThreadPost: ThreadPostSerializer,
        VisualPost: VisualPostSerializer,
        PollPost: PollPostSerializer,
        StoryPost: StoryPostSerializer,
        EventPost: EventPostSerializer,
        AudioPost: AudioPostSerializer,
    }

    all_posts = []

    for model_class, serializer_class in post_types.items():
        queryset = model_class.objects.order_by('-created_at')
        serializer = serializer_class(queryset, many=True, context={'request': request})  # 🛠 pass context here!
        all_posts.extend(serializer.data)

    # Sort all together by creation timestamp
    all_posts = sorted(all_posts, key=lambda x: x['created_at'], reverse=True)

    return Response({'posts': all_posts})
