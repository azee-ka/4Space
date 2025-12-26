# api/src/space/space/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Space, SpaceWidget, SpaceInvitation, SpaceActivity
from .serializers import (
    SpaceSerializer, SpaceListSerializer, SpaceCreateUpdateSerializer,
    SpaceWidgetSerializer, SpaceInvitationSerializer, SpaceActivitySerializer
)


# ============================================================================
# SPACE CRUD OPERATIONS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def spaces_list_create(request):
    """
    GET: List all spaces owned by or shared with the user
    POST: Create a new space
    """
    if request.method == 'GET':
        # Get spaces owned by user or where user is collaborator
        spaces = Space.objects.filter(
            Q(owner=request.user) | Q(collaborators=request.user)
        ).distinct()
        
        # Filter by type if provided
        space_type = request.query_params.get('type')
        if space_type:
            spaces = spaces.filter(type=space_type)
        
        # Exclude archived if requested
        if request.query_params.get('exclude_archived') == 'true':
            spaces = spaces.filter(is_archived=False)
        
        serializer = SpaceListSerializer(spaces, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SpaceCreateUpdateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            space = serializer.save()
            
            # Log activity
            SpaceActivity.objects.create(
                space=space,
                user=request.user,
                action='created'
            )
            
            # Return full space data
            return Response(
                SpaceSerializer(space, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def space_detail(request, space_id):
    """
    GET: Retrieve a single space
    PATCH: Update a space
    DELETE: Delete a space
    """
    space = get_object_or_404(Space, id=space_id)
    
    # Check permissions
    can_view = (
        space.owner == request.user or
        space.collaborators.filter(id=request.user.id).exists() or
        space.privacy == 'public'
    )
    
    if not can_view:
        return Response(
            {'error': 'You do not have permission to view this space'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        serializer = SpaceSerializer(space, context={'request': request})
        return Response(serializer.data)
    
    # For PATCH and DELETE, must be owner
    if space.owner != request.user:
        return Response(
            {'error': 'Only the owner can modify this space'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'PATCH':
        serializer = SpaceCreateUpdateSerializer(
            space,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            updated_space = serializer.save()
            
            # Log activity
            SpaceActivity.objects.create(
                space=updated_space,
                user=request.user,
                action='updated',
                details={'fields': list(request.data.keys())}
            )
            
            return Response(
                SpaceSerializer(updated_space, context={'request': request}).data
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        space.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================================
# WIDGET OPERATIONS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def space_widgets(request, space_id):
    """
    GET: List all widgets in a space
    POST: Add a widget to a space
    """
    space = get_object_or_404(Space, id=space_id)
    
    # Check permissions
    can_edit = (
        space.owner == request.user or
        space.collaborators.filter(id=request.user.id).exists()
    )
    
    if request.method == 'GET':
        can_view = can_edit or space.privacy == 'public'
        if not can_view:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        widgets = space.widgets.all()
        serializer = SpaceWidgetSerializer(widgets, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not can_edit:
            return Response(
                {'error': 'Only owners and collaborators can add widgets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create widget
        data = request.data.copy()
        data['space'] = str(space.id)
        
        serializer = SpaceWidgetSerializer(data=data)
        if serializer.is_valid():
            widget = serializer.save(space=space)
            
            # Log activity
            SpaceActivity.objects.create(
                space=space,
                user=request.user,
                action='widget_added',
                details={'widget_type': widget.widget_type, 'widget_name': widget.name}
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def widget_detail(request, space_id, widget_id):
    """
    GET: Retrieve a widget
    PATCH: Update a widget
    DELETE: Remove a widget
    """
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    # Check permissions
    can_edit = (
        space.owner == request.user or
        space.collaborators.filter(id=request.user.id).exists()
    )
    
    if request.method == 'GET':
        can_view = can_edit or space.privacy == 'public'
        if not can_view:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SpaceWidgetSerializer(widget)
        return Response(serializer.data)
    
    if not can_edit:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'PATCH':
        serializer = SpaceWidgetSerializer(widget, data=request.data, partial=True)
        if serializer.is_valid():
            updated_widget = serializer.save()
            
            # Log activity
            SpaceActivity.objects.create(
                space=space,
                user=request.user,
                action='widget_configured',
                details={'widget_id': str(widget.id), 'widget_name': widget.name}
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        widget_info = {'widget_type': widget.widget_type, 'widget_name': widget.name}
        widget.delete()
        
        # Log activity
        SpaceActivity.objects.create(
            space=space,
            user=request.user,
            action='widget_removed',
            details=widget_info
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================================
# COLLABORATION
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_collaborator(request, space_id):
    """
    Invite a user to collaborate on a space
    Expects: { "email": "user@example.com" }
    """
    space = get_object_or_404(Space, id=space_id)
    
    # Only owner can invite
    if space.owner != request.user:
        return Response(
            {'error': 'Only the space owner can invite collaborators'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    email = request.data.get('email')
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user exists
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        invited_user = User.objects.get(email=email)
    except User.DoesNotExist:
        invited_user = None
    
    # Create invitation
    invitation = SpaceInvitation.objects.create(
        space=space,
        invited_by=request.user,
        invited_user=invited_user,
        email=email
    )
    
    # If user exists and not already a collaborator, add them
    if invited_user and not space.collaborators.filter(id=invited_user.id).exists():
        space.collaborators.add(invited_user)
        invitation.status = 'accepted'
        invitation.save()
        
        # Log activity
        SpaceActivity.objects.create(
            space=space,
            user=request.user,
            action='collaborator_added',
            details={'collaborator': invited_user.username}
        )
    
    serializer = SpaceInvitationSerializer(invitation)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_collaborator(request, space_id):
    """
    Remove a collaborator from a space
    Expects: { "user_id": "uuid" }
    """
    space = get_object_or_404(Space, id=space_id)
    
    # Only owner can remove collaborators
    if space.owner != request.user:
        return Response(
            {'error': 'Only the space owner can remove collaborators'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    user_id = request.data.get('user_id')
    if not user_id:
        return Response(
            {'error': 'user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        user_to_remove = User.objects.get(id=user_id)
        space.collaborators.remove(user_to_remove)
        
        # Log activity
        SpaceActivity.objects.create(
            space=space,
            user=request.user,
            action='collaborator_removed',
            details={'collaborator': user_to_remove.username}
        )
        
        return Response({'status': 'Collaborator removed'})
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )


# ============================================================================
# ACTIVITY LOG
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def space_activity(request, space_id):
    """
    Get activity log for a space
    """
    space = get_object_or_404(Space, id=space_id)
    
    # Check permissions
    can_view = (
        space.owner == request.user or
        space.collaborators.filter(id=request.user.id).exists() or
        space.privacy == 'public'
    )
    
    if not can_view:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    activities = space.activities.all()[:50]  # Last 50 activities
    serializer = SpaceActivitySerializer(activities, many=True)
    return Response(serializer.data)