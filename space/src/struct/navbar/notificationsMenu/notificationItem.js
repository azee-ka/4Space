import React from 'react';
import './notificationsMenu.css';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { markAsRead as updateState } from '../../../state/reducers/notificationsSlice';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markNotificationAsRead, notificationTakeAction } from '../../../services/notifications';
import { timeAgo } from '../../../utils/convertDateTIme';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { FaChevronRight, FaEllipsisV } from "react-icons/fa";
import { NOTIFICATIONS } from '../../../services/queryKeys';
import DropdownButton from '../../../utils/popperButton/DropdownButton';

const NotificationItem = ({ notification, handleNotificationSidebarOpen, closeDropdown }) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    // Mutation: mark as read
    const markAsReadMutation = useMutation({
        mutationFn: () => markNotificationAsRead(notification.id),
        onSuccess: () => {
            dispatch(updateState(notification.id));
            // Optionally invalidate or refetch notifications
            queryClient.invalidateQueries(NOTIFICATIONS);
        },
    });

    // Mutation: action on notification (approve/reject etc)
    const takeActionMutation = useMutation({
        mutationFn: (action) => notificationTakeAction({ url: notification.action_url, action }),
        onSuccess: (data) => {
            // Could add any logic here to update the UI
            queryClient.invalidateQueries(NOTIFICATIONS);
        },
    });

    const handleMarkAsRead = (e) => {
        e.stopPropagation();
        if (!notification.is_read && !markAsReadMutation.isPending) {
            markAsReadMutation.mutate();
        }
    };

    const handleTakeAction = (action) => {
        if (!takeActionMutation.isPending) {
            takeActionMutation.mutate(action);
        }
    };

     // --- The Popper Menu content ---
    const menuContent = (
        <div className="notification-actions-dropdown">
            {!notification.is_read && (
                <button
                    className="menu-action-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(e);
                    }}
                    disabled={markAsReadMutation.isPending}
                >
                    Mark as read
                </button>
            )}
            {notification.type === 'action' && (
                <>
                    <button
                        className="menu-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTakeAction('approve');
                        }}
                        disabled={takeActionMutation.isPending}
                    >
                        Approve
                    </button>
                    <button
                        className="menu-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTakeAction('reject');
                        }}
                        disabled={takeActionMutation.isPending}
                    >
                        Reject
                    </button>
                </>
            )}
        </div>
    );

    return (
        <div
            className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
            onClick={() => {
                closeDropdown?.();
                handleNotificationSidebarOpen(notification.id);
            }}
        >
            <div className='notification-item-top-panel'>
                <h3>{notification.title}</h3>
                <button onClick={() => handleNotificationSidebarOpen(notification.id)}>
                    <FaChevronRight className='icon-style' />
                </button>
            </div>
            <div className='notification-item-content'>
                <div className='notification-item-message-container'>
                    <div className='notification-item-profile-image'>
                        <ProfilePicture src={notification.sender.profile_image} />
                    </div>
                    <p>
                        <span>
                            <Link to={`/profile/${notification.sender.username}`}>
                                {notification.sender.username}
                            </Link>
                        </span>
                        {notification.message}
                        <span>{timeAgo(notification.created_at, true)}</span>
                    </p>
                </div>
                <DropdownButton
                    toggleContent={<button onClick={(e) => e.stopPropagation()} className="notification-action-toggle"><FaEllipsisV /></button>}
                    placement="bottom-start"
                >
                    {menuContent}
                </DropdownButton>
            </div>
        </div>
    );
};

export default NotificationItem;