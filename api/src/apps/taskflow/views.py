from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Task
from .serializers import TaskSerializer, CreateTaskSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tasks(request):
    user = request.user.interactuser.taskflow_user
    tasks = Task.objects.all().order_by(user.sort_option)
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_sort_option(request):
    user = request.user.interactuser.taskflow_user
    sort_option = request.data.get('sort_option')
    if sort_option not in ['title', 'description', 'started', 'completed', 'created_at', 'updated_at']:
        return Response({'error': 'Invalid sort option'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.sort_option = sort_option
    user.save()
    return Response({'message': 'Sort option updated successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_view_mode(request):
    user = request.user.interactuser.taskflow_user
    is_grid_view_str = request.query_params.get('is_grid_view')  # Extract from query parameters
    is_grid_view = is_grid_view_str.lower() == 'true'  # Convert to boolean
    user.is_grid_view = is_grid_view
    user.save()
    return Response({'message': 'View mode updated successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_is_grid_view(request):
    user = request.user.interactuser.taskflow_user
    return Response({'is_grid_view': user.is_grid_view})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_task(request):
    serializer = CreateTaskSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)