# src/post/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from ..post.models import Post, PostFeatures
from ..post.serializers import PostSerializer, MinimalPostSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore_page(request):
    # Get all posts with their features
    posts = Post.objects.all().order_by('-created_at')  # Correct the field to 'user' and order by created_at

    serialized_posts = MinimalPostSerializer(posts, many=True)

    return Response(serialized_posts.data, status=status.HTTP_200_OK)
