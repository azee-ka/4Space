import React from 'react';
import './notificationsMenu.css';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { markAsRead } from '../../../state/reducers/notificationsSlice';
import { markAsRead as updateState } from '../../../state/reducers/notificationsSlice';
import useApi from '../../../utils/useApi';
import { timeAgo } from '../../../utils/convertDateTIme';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { FaChevronRight } from "react-icons/fa";

const NotificationItem = ({ notification, handleNotificationSidebarOpen }) => {
    const dispatch = useDispatch();
    const { callApi } = useApi();

    const handleMarkAsRead = async () => {
        try {
            await markAsRead(notification.id);
            dispatch(updateState(notification.id));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleTakeAction = async (action) => {
        try {
            const response = await callApi(notification.action_url, 'POST', { action: action });
            console.log(response.data);
        } catch (err) {
            console.error('Error taking action', err);
        }
    }

    return (
        <div
            className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
            onClick={() => handleNotificationSidebarOpen(notification.id)}
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
                        <span><Link to={`/profile/${notification.sender.username}`}>{notification.sender.username}</Link></span>
                        {notification.message}
                        <span>{timeAgo(notification.created_at, true)}</span>
                    </p>
                </div>
                {notification.type === 'action' && (
                    <div className='notification-item-actions-container'>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            handleTakeAction('approve');
                            }} 
                            className="action-button">
                            Approve
                        </button>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            handleTakeAction('reject')
                            }} 
                            className="action-button">
                            Reject
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationItem;
