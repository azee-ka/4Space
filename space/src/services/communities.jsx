// src/services/communities.js

import apiCall from "../utils/api";


// COMMUNITY
export const fetchCommunity = async (communityId) => {
  const res = await apiCall(`community/c/${communityId}/`);
  return res.data;
};

// MEMBERS
export const fetchCommunityMembers = async (communityId) => {
  const res = await apiCall(`community/${communityId}/members/`);
  return res.data;
};

export const updateRole = async ({ communityId, userId, newRole }) => {
  const res = await apiCall(`community/${communityId}/role/${userId}/`, 'PUT', { role: newRole });
  return res.data;
};

export const updatePermissions = async ({ communityId, userId, perms }) => {
  const res = await apiCall(`community/${communityId}/permissions/${userId}/`, 'PUT', { permissions: perms });
  return res.data;
};

// EXCHANGES / DISCUSSIONS
export const fetchExchanges = async (communityId) => {
  const res = await apiCall(`community/${communityId}/exchanges/list/`);
  return res.data;
};

export const createDiscussion = async ({ communityId, title, content }) => {
  const res = await apiCall(`community/${communityId}/exchanges/create/`, 'POST', { title, content });
  return res.data;
};

export const voteDiscussion = async ({ communityId, postId, direction }) => {
  const res = await apiCall(`community/${communityId}/exchanges/${postId}/vote/`, 'POST', { direction });
  return res.data;
};

// TABS (Add, fetch, etc.)
export const addCommunityTabs = async ({ communityId, tabs }) => {
  await apiCall(`community/c/${communityId}/tabs/`, 'POST', { tabs });
};

// JOIN / LEAVE COMMUNITY
export const joinCommunity = async (communityId) => {
  await apiCall(`community/${communityId}/join/`, 'POST');
};
export const leaveCommunity = async (communityId) => {
  await apiCall(`community/${communityId}/leave/`, 'DELETE');
};

// USER SEARCH & INVITE
export const searchUsersApi = async (query) => {
  return await apiCall(`search/user-search/?query=${encodeURIComponent(query)}`);
};
export const inviteUserApi = async ({ communityId, userId }) => {
  await apiCall(`community/${communityId}/invite/`, 'POST', { user_id: userId });
};

// src/apps/community/tabs/general/exchangeBoard
export const fetchExchangeDetail = async (postId) => {
  const res = await apiCall(`community/exchanges/e/${postId}/`);
  return res.data;
};

// src/apps/community/tabs/research/publicationsTab
export const fetchPublicationDetail = async (publicationId) => {
  const res = await apiCall(`community/research/publication/${publicationId}/detail/`);
  return res.data;
};

export const fetchMyPublications = async (communityId) => {
  const res = await apiCall(`community/research/${communityId}/my-publications/`);
  return res.data || [];
};
export const uploadPublication = async ({ communityId, title, abstract, file }) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('abstract', abstract);
  formData.append('file', file);
  const res = await apiCall(
    `community/research/${communityId}/publications/create/`,
    'POST',
    formData,
    'multipart/form-data'
  );
  return res.data;
};










// src/apps/communities/createCommunity
export const createCommunity = async (formData) => {
  const res = await apiCall('community/create/', 'POST', formData, 'multipart/form-data');
  return res.data;
};


// src/apps/communities/timeline
// Get all communities for the timeline
export const fetchCommunitiesTimeline = async () => {
  const res = await apiCall('community/timeline/get-communities/', 'GET');
  return res.data || [];
};




// src/pages/profile/tabs/myCommunitiesTab
// Exchanges: paginated, infinite scroll
export async function fetchUserExchanges({ username, pageParam = 0, pageSize = 20 }) {
  const url = `profile/${username}/exchanges/?limit=${pageSize}&offset=${pageParam}`;
  const resp = await apiCall(url, 'GET');
  return resp.data;
}

// Communities: static list (no paging)
export async function fetchUserCommunities(username) {
  const url = `profile/${username}/communities/`;
  const resp = await apiCall(url, 'GET');
  return resp.data;
}
