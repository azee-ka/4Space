// notificationsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        notifications: [],
        count: 0,
        isLoading: false,  // Add loading state
        error: null,       // Add error state
    },
    reducers: {
        setNotifications(state, action) {
            state.notifications = action.payload;
            state.count = action.payload.filter(notification => !notification.is_read).length;
            state.isLoading = false;  // Stop loading when notifications are set
            state.error = null;       // Clear any previous errors
        },
        appendNotification(state, action) {
            state.notifications.unshift(action.payload);
            if (!action.payload.is_read) {
                state.count += 1;
            }
        },
        markAsRead(state, action) {
            const id = action.payload;
            const notification = state.notifications.find((n) => n.id === id);
            if (notification && !notification.is_read) {
                notification.is_read = true;
                state.count -= 1;
            }
        },
        resetCount(state) {
            state.count = 0;
        },
        setNotificationsLoading(state) {
            state.isLoading = true;  // Set loading state to true
            state.error = null;       // Clear any previous errors
        },
        setNotificationsError(state, action) {
            state.isLoading = false;   // Stop loading
            state.error = action.payload;  // Set the error state
        }
    },
});

export const { 
    setNotifications, 
    appendNotification, 
    markAsRead, 
    resetCount, 
    setNotificationsLoading, 
    setNotificationsError 
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectNotificationsCount = (state) => state.notifications.count;
export const selectNotificationsLoading = (state) => state.notifications.isLoading;  // Selector for loading
export const selectNotificationsError = (state) => state.notifications.error;  // Selector for error

export default notificationsSlice.reducer;
