// NotificationsMenu.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../../utils/apiUrl';
import { useAuth } from '../../../hooks/useAuth';
import './notificationsMenu.css';
import { timeAgo } from '../../../utils/convertDateTIme';
import NotificationList from './notificationList';
import { FaChevronRight } from 'react-icons/fa';

const NotificationsMenu = ({ handleNotificationSidebarOpen }) => {

    return (
        <div className='notifications-menu-container' onClick={(e) => e.stopPropagation()}>
            <div className='notifications-menu-top-panel'>
                <h3>Notifications</h3>
                <button onClick={() => handleNotificationSidebarOpen(null)}>
                    <p>
                        Expand Panel
                        <span><FaChevronRight /></span>
                    </p>
                </button>
            </div>
            <NotificationList
                handleNotificationSidebarOpen={handleNotificationSidebarOpen}
            />
        </div>
    );
}

export default NotificationsMenu;
