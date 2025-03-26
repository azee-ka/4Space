from rest_framework.response import Response
from rest_framework.decorators import api_view
from ..models import BaseUser
from ..serializers import MentionUserSearchSerializer

@api_view(['GET'])
def user_search(request):
    query = request.GET.get('query', '')
    if query:
        users = BaseUser.objects.filter(username__icontains=query)
        serializer = MentionUserSearchSerializer(users, many=True)
        
        # Return data with HTTP 200 OK status
        return Response(serializer.data, status=200)
    # Return empty response with HTTP 404 Not Found status if no query matches
    return Response([], status=404)
