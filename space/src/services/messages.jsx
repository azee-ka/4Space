// src/services/messages.js
import apiCall from "../utils/api";

// Inbox list
export const fetchInboxConversations = async () => {
  const res = await apiCall('messages/list_conversations/');
  return res.data;
};

// Requests list
export const fetchRequestConversations = async () => {
  const res = await apiCall('messages/list_conversations_requests/');
  return res.data;
};

// User search
export const searchUsers = async (query) => {
  const res = await apiCall(`search/user-search/?query=${query}`);
  return res.data;
};


// Fetch conversation details
export const fetchConversationDetails = async (conversationId) => {
  const res = await apiCall(`messages/get_conversation_details/${conversationId}`);
  return res.data;
};

// Fetch paginated messages
export const fetchMessages = async ({ conversationId, offset = 0, limit = 30 }) => {
  const res = await apiCall(
    `messages/get_messages/${conversationId}/?limit=${limit}&offset=${offset}`
  );
  return res.data;
};

// Send a message (fallback to HTTP if no WebSocket)
export const sendMessageAPI = async ({ conversationId, text }) => {
  const res = await apiCall('messages/create_message/', 'POST', {
    text,
    conversation: conversationId,
  });
  return res.data;
};

// Accept a message request
export const acceptRequest = async (conversationId) => {
  await apiCall(`messages/request/${conversationId}/accept/`, 'POST');
};

// Reject a message request
export const rejectRequest = async (conversationId) => {
  await apiCall(`messages/request/${conversationId}/reject/`, 'POST');
};

// Block a user in a conversation
export const blockRequest = async (conversationId) => {
  await apiCall(`messages/request/${conversationId}/block/`, 'POST');
};

export async function createConversation(recipients) {
  const res = await apiCall('messages/create_conversation/', 'POST', { recipients });
  return res.data;
}
