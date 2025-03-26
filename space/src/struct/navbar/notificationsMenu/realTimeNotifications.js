import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { appendNotification } from '../redux/notificationsSlice';
import socket from '../utils/socket';

const RealTimeNotifications = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        socket.onmessage = (event) => {
            const notification = JSON.parse(event.data);
            dispatch(appendNotification(notification)); // Append notification without overwriting
        };

        return () => {
            socket.close();
        };
    }, [dispatch]);

    return null;
};

export default RealTimeNotifications;
