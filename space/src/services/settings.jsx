// services/settings.jsx
import apiCall from "../utils/api";

//settings/tabs/basicInfo
export async function fetchBasicInfo() {
  const resp = await apiCall('settings/edit-basic-info/', 'GET');
  return resp.data;
}
export async function updateBasicInfo(data) {
  const resp = await apiCall('settings/edit-basic-info/', 'POST', data);
  return resp.data;
}


//settings/tabs/visisblity
export function fetchProfileVisibilityStatus() {
  return apiCall('settings/toggle-profile-visibility/', 'GET');
}
export function toggleProfileVisibility() {
  return apiCall('settings/toggle-profile-visibility/', 'POST');
}


//settings/tabs/messageControl
// GET current message settings
export function fetchMessageSettings() {
    return apiCall('messages/settings/', 'GET');
}
// POST new message settings
export function updateMessageSettings(data) {
    return apiCall('messages/settings/', 'POST', data);
}


//settings/tabs/usernameHandle
// Fetch all handles
export async function fetchUsernameHandles() {
  const res = await apiCall('settings/username-handles/');
  return res.data;
}

// Save handles
export async function saveUsernameHandles(payload) {
  const res = await apiCall('settings/username-handles/', 'POST', payload);
  return res.data;
}