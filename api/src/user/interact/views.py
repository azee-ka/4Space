from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ..models import BaseUser
from django.shortcuts import get_object_or_404
from ...notifications.utils.notifications import send_notification_to_user
from ...notifications.models import Notification

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_follow(request, username):
    """
    Follow or unfollow a user. If the user is already following the target user,
    unfollow them, otherwise, follow the target user.
    """
    target_user = get_object_or_404(BaseUser, username=username)
    user = request.user
    
    # Ensure user is not trying to follow or unfollow themselves
    if user == target_user:
        return Response(
            {'detail': 'You cannot follow/unfollow yourself.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if the user is already following the target user
    if target_user in user.following.all():
        # If the user is following, unfollow them
        user.following.remove(target_user)
        target_user.followers.remove(user)
        return Response({'detail': f'unfollowed'}, status=status.HTTP_200_OK)
    else:
        try:
            # Check if there's already a pending follow request notification
            existing_notification = Notification.objects.get(
                user=target_user,
                sender=user,
                title="Follow Request",
                message__icontains=f"Requested to follow your account.",
                type="action",
                status='pending'  # Assuming pending requests are not approved
            )
            # If there's a pending follow request, delete the notification
            existing_notification.delete()
            return Response({'detail': 'Pending follow request canceled.'}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            pass
        # If the user is not following, follow the target user
        if target_user.is_private_profile:
            notification = Notification.objects.create(
                user=target_user,
                sender=user,
                title="Follow Request",
                message=f"Requested to follow your account.",
                type="action",
                action_url=f"profile/resolve-follow-request/{user.id}/",
            )
            send_notification_to_user(target_user.id, notification)
            return Response({'detail': 'Follow request sent. Awaiting approval.'}, status=status.HTTP_200_OK)

        else:
            user.following.add(target_user)
            target_user.followers.add(user)
            return Response({'detail': 'Followed successfully.'}, status=status.HTTP_200_OK)
        
        
        
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_follow_request(request, requester_id):
    requester = get_object_or_404(BaseUser, id=requester_id)
    user = request.user

    # Check if the requester already follows or is already followed by the user
    if requester == user:
        return Response({'detail': 'You cannot send a follow request to yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if a follow request exists for the user
    existing_notification = Notification.objects.get(
                user=user,
                sender=requester,
                title="Follow Request",
                message__icontains=f"Requested to follow your account.",
                type="action",
                status='pending'  # Assuming pending requests are not approved
            )

    if not existing_notification:
        return Response({'detail': 'No pending follow request from this user.'}, status=status.HTTP_400_BAD_REQUEST)

    action = request.data.get('action')  # Expected 'approve' or 'reject'

    if action == "approve":
        # Add the follower relationship
        user.followers.add(requester)
        requester.following.add(user)

        # Mark the notification as approved/delete
        # existing_notification.status = 'approved'
        # existing_notification.save()
        existing_notification.delete()

        # Notify the requester about approval
        Notification.objects.create(
            user=requester,
            sender=user,
            title="Follow Request Approved",
            message=f"Approved your follow request.",
            type="info",
            status="approved",
        )

        return Response({'detail': 'Follow request approved.'}, status=status.HTTP_200_OK)

    elif action == "reject":
        # Mark the notification as rejected or delete it
        # existing_notification.status = 'disapproved'
        # existing_notification.save()
        existing_notification.delete()

        # Notify the requester about rejection
        Notification.objects.create(
            user=requester,
            sender=user,
            title="Follow Request Rejected",
            message=f"Rejected your follow request.",
            type="info",
            status="disapproved",
        )

        return Response({'detail': 'Follow request rejected.'}, status=status.HTTP_200_OK)

    else:
        return Response({'detail': 'Invalid action. Use "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)
