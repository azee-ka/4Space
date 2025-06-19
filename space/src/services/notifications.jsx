// services/notifications.js
import apiCall from "../utils/api";

// Mark notification as read
export const markNotificationAsRead = async (id) => {
  return apiCall(`notifications/${id}/mark-read/`, 'POST');
};

// Take action on notification
export const notificationTakeAction = async ({ url, action }) => {
  return apiCall(url, 'POST', { action });
};
