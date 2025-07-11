// src/services/user.jsx
import apiCall from "../utils/api";

// User search
export const searchUsers = async (query) => {
  const res = await apiCall(`search/user-search/?query=${query}`);
  return res.data;
};