// services/notificationsSocket.js
export const listenForRealTimeNotifications = (dispatch) => {
    const socket = new WebSocket('wss://your-websocket-url.com');  // Replace with your WebSocket URL

    socket.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);  // Assuming the WebSocket sends notification data in JSON format
        dispatch(appendNotification(newNotification));  // Dispatch an action to store the new notification in Redux
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    // Clean up the WebSocket connection when no longer needed
    return () => {
        socket.close();
    };
};
