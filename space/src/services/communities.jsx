// src/services/communities.js

import apiCall from "../utils/api";

// create a new comment or reply
export const createComment = async ({ postId, content, parent }) => {
  // parent: null for top‐level, or comment UUID to reply under
  const res = await apiCall(
    `community/exchanges/e/${postId}/comments/create/`,
    "POST",
    { content, parent }
  );
  return res.data;
};

// fetch paginated top-level comments
export const fetchComments = async ({ postId, pageParam = 1 }) => {
  const res = await apiCall(`community/exchanges/e/${postId}/comments/?page=${pageParam}`);
  return res.data; // { results: [ ... ], next: url, previous: url }
};

// fetch paginated replies for a comment
export const fetchReplies = async ({ commentId, pageParam = 1 }) => {
  const res = await apiCall(`community/exchanges/comments/${commentId}/replies/?page=${pageParam}`);
  return res.data;
};

// COMMUNITY
export const fetchCommunity = async (communitySlug) => {
  const res = await apiCall(`community/c/${communitySlug}/`);
  return res.data;
};

// MEMBERS
export const fetchCommunityMembers = async (communitySlug) => {
  const res = await apiCall(`community/${communitySlug}/members/`);
  return res.data;
};

export const updateRole = async ({ communitySlug, userId, newRole }) => {
  const res = await apiCall(
    `community/${communitySlug}/role/${userId}/`,
    "PUT",
    { role: newRole }
  );
  return res.data;
};

export const updatePermissions = async ({ communitySlug, userId, perms }) => {
  const res = await apiCall(
    `community/${communitySlug}/permissions/${userId}/`,
    "PUT",
    { permissions: perms }
  );
  return res.data;
};

// EXCHANGES / DISCUSSIONS
export const fetchExchanges = async (communitySlug) => {
  const res = await apiCall(`community/${communitySlug}/exchanges/list/`);
  return res.data;
};

export const createDiscussion = async ({ slug, title, content }) => {
  const res = await apiCall(
    `community/${slug}/exchanges/create/`,
    "POST",
    { title, content }
  );
  return res.data;
};

export const voteDiscussion = async ({ communitySlug, postId, direction }) => {
  const res = await apiCall(
    `community/${communitySlug}/exchanges/${postId}/vote/`,
    "POST",
    { direction }
  );
  return res.data;
};

// TABS (Add, fetch, etc.)
export const addCommunityTabs = async ({ communitySlug, tabs }) => {
  await apiCall(`community/c/${communitySlug}/tabs/`, "POST", { tabs });
};

// JOIN / LEAVE COMMUNITY
export const joinCommunity = async (communitySlug) => {
  await apiCall(`community/${communitySlug}/join/`, "POST");
};
export const leaveCommunity = async (communitySlug) => {
  await apiCall(`community/${communitySlug}/leave/`, "DELETE");
};

// USER SEARCH & INVITE
export const searchUsersApi = async (query) => {
  return await apiCall(
    `search/user-search/?query=${encodeURIComponent(query)}`
  );
};
export const inviteUserApi = async ({ communitySlug, userId }) => {
  await apiCall(`community/${communitySlug}/invite/`, "POST", {
    user_id: userId,
  });
};

// src/apps/community/tabs/general/exchangeBoard
export const fetchExchangeDetail = async (postId) => {
  const res = await apiCall(`community/exchanges/e/${postId}/`);
  return res.data;
};

// src/apps/community/tabs/research/publicationsTab
export const fetchPublicationDetail = async (publicationId) => {
  const res = await apiCall(
    `community/research/publication/${publicationId}/detail/`
  );
  return res.data;
};

export const fetchMyPublications = async (communitySlug) => {
  const res = await apiCall(
    `community/research/${communitySlug}/my-publications/`
  );
  return res.data || [];
};
export const uploadPublication = async ({
  communitySlug,
  title,
  abstract,
  file,
}) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("abstract", abstract);
  formData.append("file", file);
  const res = await apiCall(
    `community/research/${communitySlug}/publications/create/`,
    "POST",
    formData,
    "multipart/form-data"
  );
  return res.data;
};




// src/apps/communities/createCommunity
export const createCommunity = async (formData) => {
  const res = await apiCall(
    "community/create/",
    "POST",
    formData,
    "multipart/form-data"
  );
  return res.data;
};


// src/apps/communities/timeline
// Get all communities for the timeline
export const fetchCommunitiesTimeline = async () => {
  const res = await apiCall("community/timeline/get-communities/", "GET");
  return res.data || [];
};




// src/pages/profile/tabs/myCommunitiesTab
// Exchanges: paginated, infinite scroll
export async function fetchUserExchanges({
  username,
  pageParam = 0,
  pageSize = 20,
}) {
  const url = `profile/${username}/exchanges/?limit=${pageSize}&offset=${pageParam}`;
  const resp = await apiCall(url, "GET");
  return resp.data;
}

// Communities: static list (no paging)
export async function fetchUserCommunities(username) {
  const url = `profile/${username}/communities/`;
  const resp = await apiCall(url, "GET");
  return resp.data;
}
