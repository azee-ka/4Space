// services/spaceApps/journalServices.jsx
import apiCall from "../../utils/api";

// ============================================================================
// JOURNAL ENTRIES
// ============================================================================

/**
 * Fetch all journal entries for a widget with optional filters
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {Object} params - Query parameters { folder, tag, mood, search, favorite, archived, author, date_from, date_to }
 * @returns {Promise<Array>} Array of journal entries
 */
export const fetchJournalEntries = async (spaceId, widgetId, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.folder) queryParams.append('folder', params.folder);
  if (params.tag) queryParams.append('tag', params.tag);
  if (params.mood) queryParams.append('mood', params.mood);
  if (params.search) queryParams.append('search', params.search);
  if (params.favorite) queryParams.append('favorite', 'true');
  if (params.archived !== undefined) queryParams.append('archived', params.archived);
  if (params.author) queryParams.append('author', params.author);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);

  const query = queryParams.toString();
  const url = `space/space/journal/${spaceId}/widgets/${widgetId}/entries/${query ? `?${query}` : ''}`;
  
  const res = await apiCall(url, 'GET');
  return res.data || [];
};

/**
 * Fetch a single journal entry by ID
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} entryId - UUID of the entry
 * @returns {Promise<Object>} Journal entry object
 */
export const fetchJournalEntry = async (spaceId, widgetId, entryId) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/entries/${entryId}/`,
    'GET'
  );
  return res.data;
};

/**
 * Create a new journal entry
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {Object} data - Entry data { title, content, date, mood, folder_id, tag_ids, is_private, is_favorite }
 * @returns {Promise<Object>} Created journal entry
 */
export const createJournalEntry = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/entries/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Update a journal entry
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} entryId - UUID of the entry
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated journal entry
 */
export const updateJournalEntry = async (spaceId, widgetId, entryId, data) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/entries/${entryId}/`,
    'PATCH',
    data
  );
  return res.data;
};

/**
 * Delete a journal entry
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} entryId - UUID of the entry
 * @returns {Promise<void>}
 */
export const deleteJournalEntry = async (spaceId, widgetId, entryId) => {
  await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/entries/${entryId}/`,
    'DELETE'
  );
};

// ============================================================================
// JOURNAL FOLDERS
// ============================================================================

/**
 * Fetch all folders for a journal widget
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @returns {Promise<Array>} Array of folder objects (hierarchical with subfolders)
 */
export const fetchJournalFolders = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/folders/`,
    'GET'
  );
  return res.data || [];
};

/**
 * Fetch a single folder by ID
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} folderId - UUID of the folder
 * @returns {Promise<Object>} Folder object with subfolders
 */
export const fetchJournalFolder = async (spaceId, widgetId, folderId) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/folders/${folderId}/`,
    'GET'
  );
  return res.data;
};

/**
 * Create a new folder
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {Object} data - Folder data { name, description, color, icon, parent }
 * @returns {Promise<Object>} Created folder
 */
export const createJournalFolder = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/folders/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Update a folder
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} folderId - UUID of the folder
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated folder
 */
export const updateJournalFolder = async (spaceId, widgetId, folderId, data) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/folders/${folderId}/`,
    'PATCH',
    data
  );
  return res.data;
};

/**
 * Delete a folder (must be empty)
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} folderId - UUID of the folder
 * @returns {Promise<void>}
 */
export const deleteJournalFolder = async (spaceId, widgetId, folderId) => {
  await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/folders/${folderId}/`,
    'DELETE'
  );
};

// ============================================================================
// JOURNAL TAGS
// ============================================================================

/**
 * Fetch all tags for a journal widget
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @returns {Promise<Array>} Array of tag objects
 */
export const fetchJournalTags = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/tags/`,
    'GET'
  );
  return res.data || [];
};

/**
 * Create a new tag
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {Object} data - Tag data { name, color }
 * @returns {Promise<Object>} Created tag
 */
export const createJournalTag = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/tags/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Delete a tag
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} tagId - UUID of the tag
 * @returns {Promise<void>}
 */
export const deleteJournalTag = async (spaceId, widgetId, tagId) => {
  await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/tags/${tagId}/`,
    'DELETE'
  );
};

// ============================================================================
// JOURNAL STATISTICS
// ============================================================================

/**
 * Fetch journal statistics for a widget
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @returns {Promise<Object>} Stats object { total_entries, current_streak, entries_this_month, etc. }
 */
export const fetchJournalStats = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/stats/`,
    'GET'
  );
  return res.data;
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Perform bulk operations on entries
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {Object} data - Bulk operation data { entry_ids: [], action: 'archive'|'delete'|'favorite'|etc }
 * @returns {Promise<Object>} Response message with count
 */
export const bulkUpdateEntries = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/bulk-update/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Move multiple entries to a folder
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {Object} data - Move data { entry_ids: [], folder_id: 'uuid' | null }
 * @returns {Promise<Object>} Response message with count
 */
export const moveEntries = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/move-entries/`,
    'POST',
    data
  );
  return res.data;
};

// ============================================================================
// ATTACHMENTS (Future Feature - Model Ready)
// ============================================================================

/**
 * Upload an attachment to an entry
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} entryId - UUID of the entry
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Created attachment object
 */
export const uploadJournalAttachment = async (spaceId, widgetId, entryId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/entries/${entryId}/attachments/`,
    'POST',
    formData,
    'multipart/form-data'
  );
  return res.data;
};

/**
 * Delete an attachment
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} entryId - UUID of the entry
 * @param {string} attachmentId - UUID of the attachment
 * @returns {Promise<void>}
 */
export const deleteJournalAttachment = async (spaceId, widgetId, entryId, attachmentId) => {
  await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/entries/${entryId}/attachments/${attachmentId}/`,
    'DELETE'
  );
};

// ============================================================================
// COMMENTS (Future Feature - Model Ready)
// ============================================================================

/**
 * Fetch comments for an entry
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} entryId - UUID of the entry
 * @returns {Promise<Array>} Array of comment objects
 */
export const fetchJournalComments = async (spaceId, widgetId, entryId) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/entries/${entryId}/comments/`,
    'GET'
  );
  return res.data || [];
};

/**
 * Create a comment on an entry
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} entryId - UUID of the entry
 * @param {Object} data - Comment data { content, parent }
 * @returns {Promise<Object>} Created comment
 */
export const createJournalComment = async (spaceId, widgetId, entryId, data) => {
  const res = await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/entries/${entryId}/comments/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Delete a comment
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the journal widget
 * @param {string} entryId - UUID of the entry
 * @param {string} commentId - UUID of the comment
 * @returns {Promise<void>}
 */
export const deleteJournalComment = async (spaceId, widgetId, entryId, commentId) => {
  await apiCall(
    `space/space/journal/${spaceId}/widgets/${widgetId}/entries/${entryId}/comments/${commentId}/`,
    'DELETE'
  );
};