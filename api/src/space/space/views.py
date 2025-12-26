# api/src/space/space/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from src.user.models import BaseUser, AuthUser
from src.notifications.models import Notification
from .models import Space, SpaceWidget, SpaceInvitation, SpaceActivity, SpacePermission
from .serializers import (
    SpaceListSerializer, SpaceDetailSerializer, SpaceCreateUpdateSerializer,
    SpaceWidgetSerializer, SpaceInvitationSerializer, SpaceActivitySerializer,
    InviteCollaboratorSerializer, UpdatePermissionsSerializer, SpacePermissionSerializer
)


# ============================================
# SPACE CRUD
# ============================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def spaces_list_create(request):
    """
    GET: List all spaces accessible to the user
    POST: Create a new space
    """
    if request.method == 'GET':
        # Get query params
        exclude_archived = request.GET.get('exclude_archived', 'false').lower() == 'true'
        space_type = request.GET.get('type')
        
        # Get owned and collaborative spaces
        spaces = Space.objects.filter(
            Q(owner=request.user) | Q(collaborators=request.user)
        ).distinct()
        
        if exclude_archived:
            spaces = spaces.filter(is_archived=False)
        
        if space_type:
            spaces = spaces.filter(type=space_type)
        
        serializer = SpaceListSerializer(spaces, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SpaceCreateUpdateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            space = serializer.save()
            
            # Log activity
            SpaceActivity.objects.create(
                space=space,
                user=request.user,
                action='created',
                details={'name': space.name}
            )
            
            # Return full details
            detail_serializer = SpaceDetailSerializer(space, context={'request': request})
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def space_detail(request, space_id):
    """
    GET: Retrieve space details
    PATCH: Update space
    DELETE: Delete space (owner only)
    """
    space = get_object_or_404(Space, id=space_id)
    
    # Check view permission
    if not space.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this space."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        serializer = SpaceDetailSerializer(space, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        # Check edit permission
        if not space.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to edit this space."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SpaceCreateUpdateSerializer(
            space, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            updated_space = serializer.save()
            
            # Log activity
            SpaceActivity.objects.create(
                space=updated_space,
                user=request.user,
                action='updated',
                details={'fields': list(serializer.validated_data.keys())}
            )
            
            detail_serializer = SpaceDetailSerializer(updated_space, context={'request': request})
            return Response(detail_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Only owner can delete
        if not space.is_owner(request.user):
            return Response(
                {"detail": "Only the owner can delete this space."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        space_name = space.name
        space.delete()
        
        return Response(
            {"detail": f"Space '{space_name}' deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )


# ============================================
# WIDGETS
# ============================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def space_widgets(request, space_id):
    """
    GET: List all widgets in a space
    POST: Add a new widget to the space
    """
    space = get_object_or_404(Space, id=space_id)
    
    if not space.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this space."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        widgets = space.widgets.filter(is_visible=True)
        serializer = SpaceWidgetSerializer(widgets, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Check permission to add widgets
        if not space.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to add widgets."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SpaceWidgetSerializer(data=request.data)
        if serializer.is_valid():
            widget = serializer.save(space=space)
            
            # Log activity
            SpaceActivity.objects.create(
                space=space,
                user=request.user,
                action='widget_added',
                details={'widget_name': widget.name, 'widget_type': widget.widget_type}
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spaces_list_with_widgets(request):
    """
    GET: List all spaces with their widgets
    """
    exclude_archived = request.GET.get('exclude_archived', 'false').lower() == 'true'
    space_type = request.GET.get('type')
    
    # Get owned and collaborative spaces
    spaces = Space.objects.filter(
        Q(owner=request.user) | Q(collaborators=request.user)
    ).distinct().prefetch_related('widgets', 'collaborators', 'owner')
    
    if exclude_archived:
        spaces = spaces.filter(is_archived=False)
    
    if space_type:
        spaces = spaces.filter(type=space_type)
    
    # Use DetailSerializer which includes widgets
    serializer = SpaceDetailSerializer(spaces, many=True, context={'request': request})
    return Response(serializer.data)



@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def widget_detail(request, space_id, widget_id):
    """
    GET: Get widget details
    PATCH: Update widget
    DELETE: Remove widget
    """
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if not space.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this space."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        serializer = SpaceWidgetSerializer(widget)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        if not space.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to edit widgets."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SpaceWidgetSerializer(widget, data=request.data, partial=True)
        if serializer.is_valid():
            updated_widget = serializer.save()
            
            # Log activity
            SpaceActivity.objects.create(
                space=space,
                user=request.user,
                action='widget_updated',
                details={'widget_name': updated_widget.name}
            )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not space.can_edit(request.user):
            return Response(
                {"detail": "You do not have permission to remove widgets."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        widget_name = widget.name
        widget.delete()
        
        # Log activity
        SpaceActivity.objects.create(
            space=space,
            user=request.user,
            action='widget_removed',
            details={'widget_name': widget_name}
        )
        
        return Response(
            {"detail": f"Widget '{widget_name}' removed successfully."},
            status=status.HTTP_204_NO_CONTENT
        )


# ============================================
# COLLABORATORS
# ============================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_collaborator(request, space_id):
    """Invite a user to collaborate on a space by email"""
    space = get_object_or_404(Space, id=space_id)
    
    # Check permission to invite
    if not space.is_owner(request.user):
        try:
            perm = SpacePermission.objects.get(space=space, user=request.user)
            if not perm.can_invite_collaborators:
                return Response({"detail": "You do not have permission to invite collaborators."}, status=status.HTTP_403_FORBIDDEN)
        except SpacePermission.DoesNotExist:
            return Response({"detail": "You do not have permission to invite collaborators."}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = InviteCollaboratorSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    message = serializer.validated_data.get('message', '')
    
    # Check if inviting self
    try:
        auth_user_self = AuthUser.objects.filter(active_handle=request.user).first()
        if auth_user_self and auth_user_self.email == email:
            return Response({"detail": "You cannot invite yourself."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        pass
    
    # Find invited user
    invited_user = None
    try:
        auth_user = AuthUser.objects.filter(email=email).first()
        if auth_user:
            invited_user = auth_user.active_handle
            
            # Check if owner
            try:
                if space.is_owner(invited_user):
                    return Response({"detail": "This user is the owner of the space."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print(f"Error checking owner: {e}")
            
            # Check if already collaborator
            try:
                if space.is_collaborator(invited_user):
                    return Response({"detail": "This user is already a collaborator."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print(f"Error checking collaborator: {e}")
    except Exception as e:
        print(f"Error looking up user: {e}")
        invited_user = None
    
    # Check for existing invitation
    try:
        existing_invite = SpaceInvitation.objects.filter(space=space, email=email, status='pending').first()
        
        if existing_invite:
            # Update existing invitation
            existing_invite.message = message
            existing_invite.invited_by = request.user
            existing_invite.save()
            
            # Update/create notification
            if invited_user:
                action_url = f"space/space/{space.id}/invitations/{existing_invite.id}/accept/"
                try:
                    existing_notif = Notification.objects.filter(user=invited_user, action_url__contains=str(existing_invite.id)).first()
                    if existing_notif:
                        existing_notif.title = f"Invitation to collaborate on {space.name}"
                        existing_notif.message = f"{request.user.username} invited you to collaborate on '{space.name}'. {message}"
                        existing_notif.sender = request.user
                        existing_notif.status = 'pending'
                        existing_notif.is_read = False
                        existing_notif.save()
                    else:
                        Notification.objects.create(
                            user=invited_user, sender=request.user,
                            title=f"Invitation to collaborate on {space.name}",
                            message=f"{request.user.username} invited you to collaborate on '{space.name}'. {message}",
                            type='action', status='pending', action_url=action_url
                        )
                except Exception as e:
                    print(f"Notification error: {e}")
            
            serializer = SpaceInvitationSerializer(existing_invite)
            return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error checking existing invite: {e}")
    
    # Create new invitation
    try:
        invitation = SpaceInvitation.objects.create(
            space=space, invited_by=request.user, email=email,
            invited_user=invited_user, message=message
        )
    except Exception as e:
        print(f"Invitation creation error: {e}")
        import traceback
        traceback.print_exc()
        return Response({"detail": f"Failed to create invitation: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Create notification
    if invited_user:
        try:
            Notification.objects.create(
                user=invited_user, sender=request.user,
                title=f"Invitation to collaborate on {space.name}",
                message=f"{request.user.username} invited you to collaborate on '{space.name}'. {message}",
                type='action', status='pending',
                action_url=f"space/space/{space.id}/invitations/{invitation.id}/accept/"
            )
        except Exception as e:
            print(f"Notification creation error: {e}")
            import traceback
            traceback.print_exc()
    
    # Log activity
    try:
        SpaceActivity.objects.create(space=space, user=request.user, action='invitation_sent', details={'email': email})
    except Exception as e:
        print(f"Activity log error: {e}")
    
    serializer = SpaceInvitationSerializer(invitation)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_invitation(request, space_id, invitation_id):
    """
    Accept an invitation to collaborate on a space.
    """
    space = get_object_or_404(Space, id=space_id)
    invitation = get_object_or_404(SpaceInvitation, id=invitation_id, space=space)
    
    # Check if this invitation is for the current user
    if invitation.invited_user != request.user:
        # Also check by email
        if request.user.account.email != invitation.email:
            return Response(
                {"detail": "This invitation is not for you."},
                status=status.HTTP_403_FORBIDDEN
            )
        # Link the invitation to the user
        invitation.invited_user = request.user
        invitation.save()
    
    # Check if invitation is still pending
    if invitation.status != 'pending':
        return Response(
            {"detail": f"This invitation has already been {invitation.status}."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Add user as collaborator
    space.collaborators.add(request.user)
    
    # Update invitation status
    invitation.status = 'accepted'
    invitation.responded_at = timezone.now()
    invitation.save()
    
    # Create default permissions for the collaborator
    SpacePermission.objects.get_or_create(
        space=space,
        user=request.user,
        defaults={
            'can_edit_space': True,
            'can_add_widgets': True,
            'can_remove_widgets': True,
            'can_invite_collaborators': False,
            'can_remove_collaborators': False,
            'can_change_settings': False,
            'can_delete_space': False,
        }
    )
    
    # Log activity
    SpaceActivity.objects.create(
        space=space,
        user=request.user,
        action='collaborator_added',
        details={'user': request.user.username}
    )
    
    # Update the notification
    Notification.objects.filter(
        user=request.user,
        action_url__contains=str(invitation.id)
    ).update(status='read')
    
    return Response(
        {"detail": f"You are now a collaborator on '{space.name}'."},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_invitation(request, space_id, invitation_id):
    """
    Decline an invitation to collaborate on a space.
    """
    space = get_object_or_404(Space, id=space_id)
    invitation = get_object_or_404(SpaceInvitation, id=invitation_id, space=space)
    
    # Check if this invitation is for the current user
    if invitation.invited_user != request.user and request.user.account.email != invitation.email:
        return Response(
            {"detail": "This invitation is not for you."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if invitation is still pending
    if invitation.status != 'pending':
        return Response(
            {"detail": f"This invitation has already been {invitation.status}."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update invitation status
    invitation.status = 'declined'
    invitation.responded_at = timezone.now()
    if not invitation.invited_user:
        invitation.invited_user = request.user
    invitation.save()
    
    # Update the notification
    Notification.objects.filter(
        user=request.user,
        action_url__contains=str(invitation.id)
    ).update(status='read')
    
    return Response(
        {"detail": "Invitation declined."},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_collaborator(request, space_id):
    """
    Remove a collaborator from a space.
    Owner or users with permission can remove collaborators.
    """
    space = get_object_or_404(Space, id=space_id)
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response(
            {"detail": "user_id is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check permission
    if not space.is_owner(request.user):
        try:
            perm = SpacePermission.objects.get(space=space, user=request.user)
            if not perm.can_remove_collaborators:
                return Response(
                    {"detail": "You do not have permission to remove collaborators."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except SpacePermission.DoesNotExist:
            return Response(
                {"detail": "You do not have permission to remove collaborators."},
                status=status.HTTP_403_FORBIDDEN
            )
    
    collaborator = get_object_or_404(BaseUser, id=user_id)
    
    # Check if user is actually a collaborator
    if not space.is_collaborator(collaborator):
        return Response(
            {"detail": "This user is not a collaborator."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Remove collaborator
    space.collaborators.remove(collaborator)
    
    # Remove their permissions
    SpacePermission.objects.filter(space=space, user=collaborator).delete()
    
    # Log activity
    SpaceActivity.objects.create(
        space=space,
        user=request.user,
        action='collaborator_removed',
        details={'user': collaborator.username}
    )
    
    # Notify the removed user
    Notification.objects.create(
        user=collaborator,
        sender=request.user,
        title=f"Removed from {space.name}",
        message=f"You have been removed as a collaborator from '{space.name}'.",
        type='info'
    )
    
    return Response(
        {"detail": f"{collaborator.username} removed from space."},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_invitations(request, space_id):
    """
    List all pending invitations for a space (owner/admin only).
    """
    space = get_object_or_404(Space, id=space_id)
    
    if not space.is_owner(request.user):
        return Response(
            {"detail": "Only the owner can view invitations."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    invitations = space.invitations.filter(status='pending')
    serializer = SpaceInvitationSerializer(invitations, many=True)
    return Response(serializer.data)


# ============================================
# PERMISSIONS
# ============================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_collaborator_permissions(request, space_id):
    """
    Update permissions for a collaborator (owner only).
    """
    space = get_object_or_404(Space, id=space_id)
    
    if not space.is_owner(request.user):
        return Response(
            {"detail": "Only the owner can update permissions."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = UpdatePermissionsSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user_id = serializer.validated_data['user_id']
    permissions = serializer.validated_data['permissions']
    
    collaborator = get_object_or_404(BaseUser, id=user_id)
    
    if not space.is_collaborator(collaborator):
        return Response(
            {"detail": "This user is not a collaborator."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get or create permission object
    perm, created = SpacePermission.objects.get_or_create(
        space=space,
        user=collaborator
    )
    
    # Update permissions
    for key, value in permissions.items():
        setattr(perm, key, value)
    perm.save()
    
    return Response(
        SpacePermissionSerializer(perm).data,
        status=status.HTTP_200_OK
    )


# ============================================
# ACTIVITY LOG
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def space_activity(request, space_id):
    """
    Get activity log for a space.
    """
    space = get_object_or_404(Space, id=space_id)
    
    if not space.can_view(request.user):
        return Response(
            {"detail": "You do not have permission to view this space."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    activities = space.activities.all()[:50]  # Last 50 activities
    serializer = SpaceActivitySerializer(activities, many=True)
    return Response(serializer.data)