import React, { useState, useEffect, useRef } from 'react';
import './notifications.css';
import GetConfig from '../Authentication/utils/config';
import { useAuthState } from '../Authentication/utils/AuthProvider';

const Notifications = ({ notifications }) => {
    const { token, user } = useAuthState();
    const config = GetConfig(token);
    // const [notifications, setNotifications] = useState([]);

    // const websocket = useRef(null);
    // const isWebSocketInitialized = useRef(false); // Track WebSocket initialization

    // useEffect(() => {
    //     if (!isWebSocketInitialized.current) {
    //         websocket.current = new WebSocket(`ws://localhost:8000/ws/notifications/${user.id}/`, [], config);
    //         isWebSocketInitialized.current = true;

    //         websocket.current.onopen = () => {
    //             console.log('WebSocket connection established');
    //         };

    //         websocket.current.onmessage = (event) => {
    //             const data = JSON.parse(event.data);
    //             console.log(data);

    //             // Check for duplicates before updating the notifications state
    //             setNotifications(prevNotifications => {
    //                 const isDuplicate = prevNotifications.some(notification => notification.id === data.id);
    //                 if (!isDuplicate) {
    //                     return [data, ...prevNotifications];
    //                 }
    //                 return prevNotifications;
    //             });
    //         };

    //         websocket.current.onclose = () => {
    //             console.log('WebSocket closed');
    //             isWebSocketInitialized.current = false; // Allow reconnection if needed
    //         };

    //         websocket.current.onerror = (error) => {
    //             console.error('WebSocket error:', error);
    //         };
    //     }

    //     // Cleanup function
    //     return () => {
    //         if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
    //             websocket.current.close();
    //         }
    //     };
    // }, [config, user.id]);

    return (
        <div className="notifications-card" onClick={(e) => e.stopPropagation()} >
            <ul>
                {notifications.map((notification, index) => (
                    <li key={index}>
                        {notification.actor_username} {notification.verb}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notifications;
