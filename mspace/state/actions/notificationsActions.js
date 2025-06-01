// actions/notificationsActions.js
import { fetchNotifications } from '../services/notifications'; // Import the service
import { setNotifications, setNotificationsError, setNotificationsLoading } from '../reducers/notificationsSlice';

// Thunk to load notifications
export const loadNotifications = ({ callApi }) => async (dispatch) => {
    dispatch(setNotificationsLoading()); // Set loading state to true
    try {
        const data = await fetchNotifications(callApi); // Fetch notifications
        dispatch(setNotifications(data)); // Dispatch the fetched data to the store
    } catch (error) {
        dispatch(setNotificationsError(error.message)); // Dispatch error if any
    }
};
