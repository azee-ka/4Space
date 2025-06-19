// src/services/posts.js

import apiCall from "../utils/api";









// General-purpose fetcher for profile posts (visual/thread)
export const fetchUserPosts = async ({ username, postType, pageParam = 0, pageSize = 20 }) => {
  // Compose your endpoint with params
  const url = `profile/posts/${username}/list/?post_type=${postType}&limit=${pageSize}&offset=${pageParam}`;
  const response = await apiCall(url);
  return response.data; // { results, next, count }
};
