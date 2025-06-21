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



export const fetchProfessionalProfile = async (username) => {
  // if you pass a username, hit /professional/<username>/, otherwise /professional/
  const endpoint = username
    ? `profile/tab/professional/${username}/`
    : `profile/tab/professional/`;
  const { data } = await apiCall(endpoint);
  return data;
};

export const saveProfessionalProfile = async (payload) => {
  // PATCH your own professional profile
  const { data } = await apiCall(`profile/tab/professional/`, 'PATCH', payload);
  return data;
};
