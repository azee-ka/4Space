// services/home.js
import apiCall from "../utils/api";

// Create a new post (Thread, Visual, Poll, Event)
export const createPost = async (formData) => {
  const res = await apiCall('posts/post/', 'POST', formData, 'multipart/form-data');
  return res.data;
};


// Accepts { postType: 'Visual' | 'Thread', pageParam, pageSize }
export const fetchExplorePosts = async ({ postType, pageParam = 0, pageSize = 20 }) => {
  const res = await apiCall(
    `posts/explore/get-posts/?post_type=${postType}&limit=${pageSize}&offset=${pageParam}`,
    'GET'
  );
  return {
    results: res.data.results,
    next: res.data.next,   // URL or null
    count: res.data.count
  };


};

// Fetch timeline posts (paginated)
export const fetchTimelineFeed = async ({ pageParam = 0, pageSize = 20 }) => {
  const res = await apiCall(
    `posts/timeline/get-posts/?limit=${pageSize}&offset=${pageParam}`,
    'GET'
  );
  return {
    results: res.data.results,
    next: res.data.next, // URL for next page, if any
    count: res.data.count
  };
};