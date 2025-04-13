from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ...post.models import BasePost
from ...post.serializers import BasePostSerializer
from ...user.models import BaseUser

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # You can add authentication as needed
def get_profile_posts_list(request, username):
    # Get the user object by username
    try:
        user = BaseUser.objects.get(username=username)
    except BaseUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    # Get all flares from the specified user
    user_flares = BasePost.objects.filter(user=user)
    
    # Serialize the posts
    serializer = BasePostSerializer(user_flares, many=True)
    return Response(serializer.data)