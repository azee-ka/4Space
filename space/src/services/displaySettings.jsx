// src/services/displaySettings.js
import apiCall from "../utils/api";

export const fetchDisplaySettings = async () => {
  const res = await apiCall('settings/load/?category=display');
  return res.data.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
};


export const saveDisplaySettings = async (settings) => {
  // Make sure your backend expects this shape (category + settings)
  return await apiCall('settings/save/', 'POST', { category: 'display', settings });
};