import apiCall from '../utils/api';

// Fetch search history
export const fetchSearchHistory = async () => {
  const res = await apiCall(`search/user-search/history/`);
  return res.data;
};

// Search users by query
export const searchUsers = async (query) => {
  const res = await apiCall(`search/user-search/?query=${encodeURIComponent(query)}`);
  return res.data;
};

// Store a search action (for history)
export const storeSearchHistoryItem = async (username) => {
  const res = await apiCall(`search/user-search/store/${username}/`, 'POST');
  return res.data;
};

// Delete a search item from history
export const deleteSearchHistoryItem = async (username) => {
  const res = await apiCall(`search/user-search/delete/${username}/`, 'DELETE');
  return res.data;
};
