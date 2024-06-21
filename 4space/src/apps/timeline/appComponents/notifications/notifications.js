import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './notifications.css';
import GetConfig from '../../../../general/components/Authentication/utils/config';
import API_BASE_URL from '../../../../config';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import ProfilePicture from '../../../../general/utils/profilePicture/getProfilePicture';

const Notifications = ({ notifications: notificationsIncoming, setNotificationCount }) => {
    const { token, user } = useAuthState();
    const config = GetConfig(token);

    const [notifications, setNotifications] = useState([]);

    const observer = useRef();

    const fetchAllNotifications = async () => {
        try {
            // console.log(config);
            const response = await axios.get(`${API_BASE_URL}api/components/notifications/all-notifications/`, config);
            console.log(response.data);
            setNotifications(response.data);

            // console.log(response.data)
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.patch(`${API_BASE_URL}api/components/notifications/mark-as-read/${id}/`, {}, config);
            setNotifications(notifications.map(notification =>
                notification.id === id ? { ...notification, unread: false } : notification
            ));
            setNotificationCount(prevCount => Math.max(prevCount - 1, 0));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const handleIntersect = useCallback((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const notificationIndex = Array.from(entry.target.parentNode.children).indexOf(entry.target);
                if (notificationIndex >= 0) {
                    if (!entry.target.dataset.markedAsRead) {
                        entry.target.dataset.markedAsRead = true; // Set flag to prevent duplicate calls
                        setTimeout(() => {
                            markAsRead(notifications[notificationIndex].id);
                        }, 3000); // Mark as read after 3 seconds in view
                    }
                }
            }
        });
    }, [markAsRead, notifications]);
    
    

    useEffect(() => {
        fetchAllNotifications();
    }, []);

    useEffect(() => {
        if (notificationsIncoming && notificationsIncoming.length > 0) {
            setNotifications(prevNotifications => [...notificationsIncoming, ...prevNotifications]);
        }
    }, [notificationsIncoming]);


    useEffect(() => {
        observer.current = new IntersectionObserver(handleIntersect, {
            threshold: 1.0
        });

        const elements = document.querySelectorAll('.notification-per-item');
        elements.forEach(element => observer.current.observe(element));

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [notifications, handleIntersect]);


    const handleAccept = async (notificationId) => {
        try {
            // Call your API to accept the follow request
            await axios.post(`${API_BASE_URL}api/components/notifications/accept-follow-request/${notificationId}/`, {}, config);
            // Update the notification state accordingly
            setNotifications(notifications.map(notification =>
                notification.id === notificationId ? { ...notification, unread: false } : notification
            ));
            setNotificationCount(prevCount => Math.max(prevCount - 1, 0));
            console.log('accepted');
        } catch (error) {
            console.error('Failed to accept follow request', error);
        }
    };

    const handleReject = async (notificationId) => {
        try {
            // Call your API to reject the follow request
            await axios.post(`${API_BASE_URL}api/components/notifications/reject-follow-request/${notificationId}/`, {}, config);
            // Update the notification state accordingly
            setNotifications(notifications.filter(notification => notification.id !== notificationId));
        } catch (error) {
            console.error('Failed to reject follow request', error);
        }
    };

    return (
        <div className="notifications-card" onClick={(e) => e.stopPropagation()} >
            {notifications.length === 0 ? (
                <div className='notifications-card-inner no-notification'>
                    No Notifications
                </div>
            ) : (
                <div className='notifications-card-inner'>
                    {notifications.map((notification, index) => (
                        <div key={index} className='notification-per-item'>
                            <div className='notification-actor-profile-picture'>
                                <ProfilePicture src={notification.actor.profile_picture} />
                            </div>
                            <div className='notification-actor-username-message'>
                                <p>{notification.actor.username} {notification.verb}</p>
                                {notification.notification_type === 'action' && (
                                    <div className="notification-actions">
                                        <button onClick={() => handleAccept(notification.id)}>Accept</button>
                                        <button onClick={() => handleReject(notification.id)}>Reject</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div>
    );
};

export default Notifications;
