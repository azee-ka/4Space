# api/phrase/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Flare
from ..serializers import MinimalFlareSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # You can add authentication as needed
def get_explore_posts(request):
    # Get all posts from the database
    posts = Flare.objects.all().order_by('?')
    
    # Serialize the posts
    serializer = MinimalFlareSerializer(posts, many=True)
    return Response(serializer.data)
