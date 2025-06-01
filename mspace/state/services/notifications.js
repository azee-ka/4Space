// services/notifications.js

export const fetchNotifications = async (callApi) => {
    try {
        const response = await callApi(`notifications/list/`);  // Ensure the endpoint is correct
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Failed to fetch notifications');
    }
};

export const markAsRead = async (id, callApi) => {
    try {
        await callApi(`notifications/mark-as-read/${id}/`, 'POST');
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read');
    }
};
