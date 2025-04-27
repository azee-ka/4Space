from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import ThreadPost, VisualPost
from ..serializers import MinimalThreadPostSerializer, MinimalVisualPostSerializer  # unified serializer you already have

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore_posts(request):
    posts = list(ThreadPost.objects.all()) + list(VisualPost.objects.all())
    posts.sort(key=lambda x: x.created_at, reverse=True)

    serialized_posts = []
    for post in posts:
        if isinstance(post, ThreadPost):
            serializer = MinimalThreadPostSerializer(post, context={'request': request})
        elif isinstance(post, VisualPost):
            serializer = MinimalVisualPostSerializer(post, context={'request': request})
        serialized_posts.append(serializer.data)

    return Response({'posts': serialized_posts})

