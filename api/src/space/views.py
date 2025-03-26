from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
import uuid
from .models import Space, SpaceMembership, Widget
from .serializers import SpaceSerializer, SpaceMembershipSerializer, WidgetSerializer, CreateSpaceSerializer, ListSpacesSerializer

# List spaces for the user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_spaces(request):
    spaces = Space.objects.all()
    serializer = ListSpacesSerializer(spaces, many=True)
    return Response(serializer.data)


# Create a new space
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_space(request):
    """
    Handles creating a new space
    """
    if request.method == 'POST':
        serializer = CreateSpaceSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            space = serializer.save()
            return Response({"uuid": space.uuid}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# Get a specific space's details
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def space_detail(request, space_id):
    space = get_object_or_404(Space, uuid=space_id)
    serializer = SpaceSerializer(space)
    return Response(serializer.data)

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
import uuid
from .models import Space, SpaceMembership, Widget
from .serializers import SpaceSerializer, SpaceMembershipSerializer, WidgetSerializer, CreateSpaceSerializer, ListSpacesSerializer

# List spaces for the user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_spaces(request):
    spaces = Space.objects.all()
    serializer = ListSpacesSerializer(spaces, many=True)
    return Response(serializer.data)


# Create a new space
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_space(request):
    """
    Handles creating a new space
    """
    if request.method == 'POST':
        serializer = CreateSpaceSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            space = serializer.save()
            return Response({"uuid": space.uuid}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# Get a specific space's details
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def space_detail(request, space_id):
    space = get_object_or_404(Space, uuid=space_id)
    serializer = SpaceSerializer(space)
    return Response(serializer.data)


# Update a space's details
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_space(request, space_id):
    space = get_object_or_404(Space, uuid=space_id)
    data = request.data  # no need for JSONParser(), DRF handles it
    serializer = SpaceSerializer(space, data=data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=400)

# Delete a space
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_space(request, space_id):
    space = get_object_or_404(Space, uuid=space_id)
    space.delete()
    return Response({'message': 'Space deleted successfully'}, status=204)













# Add a member to a space
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_member(request, space_id):
    space = get_object_or_404(Space, uuid=space_id)
    user_id = request.data.get('user_id')
    role = request.data.get('role', 'viewer')  # Default role is 'viewer'
    
    membership = SpaceMembership.objects.create(user_id=user_id, space=space, role=role)
    membership_serializer = SpaceMembershipSerializer(membership)
    return Response(membership_serializer.data, status=201)

# Update a membership role
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_membership(request, space_id, membership_id):
    membership = get_object_or_404(SpaceMembership, pk=membership_id, space_id=space_id)
    data = request.data  # No need for JSONParser()
    
    serializer = SpaceMembershipSerializer(membership, data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=400)

# Remove a member from a space
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_member(request, space_id, membership_id):
    membership = get_object_or_404(SpaceMembership, pk=membership_id, space_id=space_id)
    membership.delete()
    return Response({'message': 'Member removed successfully'}, status=204)









# List widgets for a specific space
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_widgets(request, space_id):
    space = get_object_or_404(Space, pk=space_id)
    widgets = Widget.objects.filter(space=space)
    serializer = WidgetSerializer(widgets, many=True)
    return Response(serializer.data)

# Create a new widget in a space
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_widget(request, space_id):
    space = get_object_or_404(Space, pk=space_id)
    data = request.data  # No need for JSONParser()
    data['space'] = space.id  # Assign space ID to the widget data
    
    serializer = WidgetSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    
    return Response(serializer.errors, status=400)

# Get the details of a specific widget
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def widget_detail(request, widget_id):
    widget = get_object_or_404(Widget, pk=widget_id)
    serializer = WidgetSerializer(widget)
    return Response(serializer.data)

# Update widget details
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_widget(request, widget_id):
    widget = get_object_or_404(Widget, pk=widget_id)
    data = request.data  # No need for JSONParser()
    
    serializer = WidgetSerializer(widget, data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=400)

# Delete a widget
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_widget(request, widget_id):
    widget = get_object_or_404(Widget, pk=widget_id)
    widget.delete()
    return Response({'message': 'Widget deleted successfully'}, status=204)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def editable_space_info(request, space_id):
    # Fetch the space by its UUID (space_id)
    space = get_object_or_404(Space, uuid=space_id)
    # Serialize the space data
    serializer = SpaceSerializer(space)
    # If the serialization is valid, return the data
    return Response(serializer.data)

# Update a space's details
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_space(request, space_id):
    space = get_object_or_404(Space, uuid=space_id)
    data = request.data
    serializer = SpaceSerializer(space, data=data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=400)

# Delete a space
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_space(request, space_id):
    space = get_object_or_404(Space, uuid=space_id)
    space.delete()
    return Response({'message': 'Space deleted successfully'}, status=204)













# Add a member to a space
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_member(request, space_id):
    space = get_object_or_404(Space, uuid=space_id)
    user_id = request.data.get('user_id')
    role = request.data.get('role', 'viewer')  # Default role is 'viewer'
    
    membership = SpaceMembership.objects.create(user_id=user_id, space=space, role=role)
    membership_serializer = SpaceMembershipSerializer(membership)
    return Response(membership_serializer.data, status=201)

# Update a membership role
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_membership(request, space_id, membership_id):
    membership = get_object_or_404(SpaceMembership, pk=membership_id, space_id=space_id)
    data = request.data  # No need for JSONParser()
    
    serializer = SpaceMembershipSerializer(membership, data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=400)

# Remove a member from a space
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_member(request, space_id, membership_id):
    membership = get_object_or_404(SpaceMembership, pk=membership_id, space_id=space_id)
    membership.delete()
    return Response({'message': 'Member removed successfully'}, status=204)









# List widgets for a specific space
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_widgets(request, space_id):
    space = get_object_or_404(Space, pk=space_id)
    widgets = Widget.objects.filter(space=space)
    serializer = WidgetSerializer(widgets, many=True)
    return Response(serializer.data)

# Create a new widget in a space
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_widget(request, space_id):
    space = get_object_or_404(Space, uuid=space_id)
    data = request.data
    data['space'] = space.id  # Associate widget with space
    serializer = WidgetSerializer(data=data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_widget(request, widget_id):
    widget = get_object_or_404(Widget, pk=widget_id)
    data = request.data
    serializer = WidgetSerializer(widget, data=data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)


# Get the details of a specific widget
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def widget_detail(request, widget_id):
    widget = get_object_or_404(Widget, pk=widget_id)
    serializer = WidgetSerializer(widget)
    return Response(serializer.data)


# Delete a widget
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_widget(request, widget_id):
    widget = get_object_or_404(Widget, pk=widget_id)
    widget.delete()
    return Response({'message': 'Widget deleted successfully'}, status=204)
