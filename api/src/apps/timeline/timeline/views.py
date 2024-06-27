# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..post.models import Post
from ..post.serializers import PostSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def timeline_posts(request):
    user = request.user.interactuser.timeline_user
    following = user.following.all()

    posts = Post.objects.filter(user__in=following).order_by('-created_at')  # Correct the field to 'user' and order by created_at
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)