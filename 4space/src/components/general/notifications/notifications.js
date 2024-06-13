import React, { useState, useEffect, useRef } from 'react';
import './notifications.css';
import GetConfig from '../Authentication/utils/config';
import { useAuthState } from '../Authentication/utils/AuthProvider';

const Notifications = () => {
    const { token } = useAuthState();
    const config = GetConfig(token);
    const [notifications, setNotifications] = useState([]);

    const websocket = useRef(null);
    const [socketInitialized, setSocketInitialized] = useState(false); // Track WebSocket initialization


    useEffect(() => {
        if (!socketInitialized) {

            websocket.current = new WebSocket(`ws://localhost:8000/ws/notifications/`, [], config);
            setSocketInitialized(true);

            websocket.current.onopen = () => {
                console.log('WebSocket connection established');
            };

            websocket.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setNotifications(prevNotifications => [data, ...prevNotifications]);
            };

        }
        websocket.current.onclose = () => {
            console.log('WebSocket closed');
        };

        websocket.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };


        // Cleanup function
        return () => {
            if (websocket && websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }
        };
    }, [config, socketInitialized]);

    return (
        <div className="notifications-card" onClick={(e) => e.stopPropagation()} >
            <ul>
                {notifications.map((notification, index) => (
                    <li key={index}>
                        {notification.actor} {notification.verb}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notifications;
