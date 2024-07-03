# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import SearchHistory
from .serializers import SearchHistorySerializer
from ...user.baseUser.models import BaseUser
from ...user.timelineUser.models import TimelineUser

from django.utils import timezone

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def store_search_history(request, user_id):
    
    if user_id:
        searched_user = get_object_or_404(BaseUser, id=user_id)

        # Check if the user is already in the search history
        search_entry = SearchHistory.objects.filter(user=request.user, searched_user=searched_user).first()

        if search_entry:
            # If the user is already in the history, update the timestamp
            search_entry.timestamp = timezone.now()
            search_entry.save()
        else:
            # If the user is not in the history, create a new entry
            SearchHistory.objects.create(user=request.user, searched_user=searched_user)

        return Response({"message": "Search history stored successfully."})
    else:
        return Response({"message": "Invalid request data."}, status=400)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_search_history(request):
    user = request.user
    search_history = SearchHistory.objects.filter(user=user).order_by('-timestamp')
    serializer = SearchHistorySerializer(search_history, many=True)
    return Response(serializer.data)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_search_history(request, user_id):

    try:
        # Get the user based on the provided username
        user_to_delete = get_object_or_404(BaseUser, id=user_id)
        print(f'user_to_delete {user_to_delete}')
        # Delete search history entries for the specified user
        SearchHistory.objects.filter(user=request.user, searched_user=user_to_delete).delete()

        return Response({"message": f"Search history for {user_id} deleted successfully."})
    except Exception as e:
        print(f'Error: {e}')
        return Response({"message": "Invalid request data."}, status=400)