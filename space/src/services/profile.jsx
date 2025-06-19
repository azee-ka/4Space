// src/services/profile.js
import apiCall from '../utils/api';

// Get a profile by username (or 'me')
export const fetchProfile = async (username) => {
    const user = username || 'me';
    const response = await apiCall(`profile/${user}/`);
    return response.data;
};

// Toggle follow/unfollow
export const toggleFollowProfile = async (username) => {
    const response = await apiCall(`profile/follow-toggle/${username}/`, 'POST');
    return response.data;
};
