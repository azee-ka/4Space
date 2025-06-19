import React, { useEffect, useState } from "react";
import './notificationSidebar.css';
import { Link, useNavigate } from "react-router-dom";
import useNotifications from "../../../hooks/useNotifications";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { timeAgo } from "../../../utils/convertDateTIme";
import useApi from "../../../utils/useApi";
import { FaArrowLeft, FaArrowRight, FaChevronLeft } from "react-icons/fa";

const NotificationSidebar = ({
    notificationSidebarOpen,
    notificationIdForSidebar,
    setNotificationIdForSidebar,
    handleNotificationSidebarClose,
    handleNotificationSidebarOpen
}) => {
    const { notifications } = useNotifications();
    const { callApi } = useApi();

    const [individualNotification, setIndividualNotification] = useState(null);

    const fetchIndividualNotification = async (notificationIdForSidebar) => {
        try {
            const response = await callApi(`notifications/notification/${notificationIdForSidebar}`);
            console.log(response.data);
            setIndividualNotification(response.data);
        } catch (err) {
            console.error('Error fetching notification', err);
        }
    };

    useEffect(() => {
        if (notificationIdForSidebar) {
            fetchIndividualNotification(notificationIdForSidebar);
        }
    }, [notificationIdForSidebar]);

    const handleTakeAction = async (notification, action) => {
        try {
            const response = await callApi(notification.action_url, 'POST', { action: action });
            console.log(response.data);
        } catch (err) {
            console.error('Error taking action', err);
        }
    }


    return (
        <div className={`notification-sidebar ${notificationSidebarOpen ? '' : 'close'}`} onClick={(e) => e.stopPropagation(e)} >
            <div className="notification-sidebar-top-panel">
                <button
                    onClick={() => handleNotificationSidebarClose()}
                >
                    <FaArrowLeft className="icon-style" />
                </button>
                <h2>Notifications</h2>
                <div className="notification-sidebar-description">
                    <p>Any type of notification will appear here.</p>
                </div>
            </div>
            <div className="notification-sidebar-main-panel">
                {notifications.length > 0 ? (
                    !notificationIdForSidebar ? (
                        <div className="notification-sidebar-main-panel-inner">
                            {notifications.map((notification, index) => (
                                <div
                                    className={`notification-sidebar-item ${notification.is_read ? 'read' : 'unread'}`}
                                    key={index}
                                    onClick={() => handleNotificationSidebarOpen(notification.id)}
                                >
                                    <div className='notification-sidebar-item-top-panel'>
                                        <h3>{notification.title}</h3>
                                    </div>
                                    <div className='notification-sidebar-item-content'>
                                        <div className='notification-sidebar-item-message-container'>
                                            <div className='notification-sidebar-item-profile-image'>
                                                <ProfilePicture src={notification.sender.profile_image} />
                                            </div>
                                            <p>
                                                <span><Link to={`/profile/${notification.sender.username}`}>{notification.sender.username}</Link></span>
                                                {notification.message}
                                                <span>{timeAgo(notification.created_at, true)}</span>
                                            </p>
                                        </div>
                                        {notification.type === 'action' && (
                                            <div className='notification-sidebar-item-actions-container'>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleTakeAction(notification, 'approve')
                                                    }}
                                                    className="action-button"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleTakeAction(notification, 'reject')
                                                    }}
                                                    className="action-button"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="notification-sidebar-individual-notification">
                            <div className="notification-sidebar-individual-notification-top-panel">
                                <button onClick={() => setNotificationIdForSidebar(null)}>
                                    <FaChevronLeft className="icon-style" />
                                </button>
                                <h4>{individualNotification?.title}</h4>
                            </div>

                            <div className="notification-sidebar-individual-notification-item-content">
                                <div className="notification-individual-row">
                                    <div className="notification-individual-profile-image">
                                        <ProfilePicture src={individualNotification?.sender?.profile_image} />
                                    </div>
                                    <div className="notification-individual-header">
                                        <div className="notification-individual-username-row">
                                            <span className="notification-individual-username">
                                                <Link to={`/profile/${individualNotification?.sender?.username}`}>
                                                    {individualNotification?.sender?.username}
                                                </Link>
                                            </span>
                                            <span className="notification-individual-timestamp">
                                                {timeAgo(individualNotification?.created_at, true)}
                                            </span>
                                        </div>
                                        <div className="notification-individual-message-text">
                                            {individualNotification?.message}
                                        </div>
                                    </div>
                                </div>

                                {individualNotification?.type === 'action' && (
                                    <div className="notification-individual-actions-container">
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleTakeAction(individualNotification, 'approve');
                                            }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleTakeAction(individualNotification, 'reject');
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    )
                ) : (
                    <div className='notifications-sidebar-no-notifications'>
                        <h3>No Notifications!</h3>
                    </div>
                )
                }
            </div>
        </div>
    )
}

export default NotificationSidebar;