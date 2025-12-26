// space/src/services/space.js
import apiCall from "../utils/api";

// ============================================================================
// SPACE CRUD OPERATIONS (New Feature - Custom Workspaces)
// ============================================================================

/**
 * Fetch all spaces for the current user
 * @param {Object} params - Query parameters { type, exclude_archived }
 * @returns {Promise<Array>} Array of spaces
 */
export const fetchSpaces = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = `space/space/with-widgets/${queryParams ? `?${queryParams}` : ''}`;
  const res = await apiCall(url, 'GET');
  return res.data || [];
};

/**
 * Fetch a single space by ID
 * @param {string} spaceId - UUID of the space
 * @returns {Promise<Object>} Space object with widgets
 */
export const fetchSpace = async (spaceId) => {
  const res = await apiCall(`space/space/${spaceId}/`, 'GET');
  return res.data;
};

/**
 * Create a new space
 * @param {Object} spaceData - { name, definition, type, privacy, accent_color, config }
 * @returns {Promise<Object>} Created space
 */
export const createSpace = async (spaceData) => {
  const res = await apiCall('space/space/', 'POST', spaceData);
  return res.data;
};

/**
 * Update a space
 * @param {string} spaceId - UUID of the space
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated space
 */
export const updateSpace = async (spaceId, updates) => {
  const res = await apiCall(`space/space/${spaceId}/`, 'PATCH', updates);
  return res.data;
};

/**
 * Delete a space
 * @param {string} spaceId - UUID of the space
 * @returns {Promise<void>}
 */
export const deleteSpace = async (spaceId) => {
  await apiCall(`space/space/${spaceId}/`, 'DELETE');
};

// ============================================================================
// WIDGET OPERATIONS (New Feature)
// ============================================================================

/**
 * Fetch all widgets for a space
 * @param {string} spaceId - UUID of the space
 * @returns {Promise<Array>} Array of widgets
 */
export const fetchSpaceWidgets = async (spaceId) => {
  const res = await apiCall(`space/space/${spaceId}/widgets/`, 'GET');
  return res.data || [];
};

/**
 * Fetch a single widget by ID
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the widget
 * @returns {Promise<Object>} Widget object
 */
export const fetchSpaceWidget = async (spaceId, widgetId) => {
  const res = await apiCall(`space/space/${spaceId}/widgets/${widgetId}/`, 'GET');
  return res.data;
};

/**
 * Add a widget to a space
 * @param {string} spaceId - UUID of the space
 * @param {Object} widgetData - { widget_type, name, description, size, config, position_x, position_y, order }
 * @returns {Promise<Object>} Created widget
 */
export const addSpaceWidget = async (spaceId, widgetData) => {
  const res = await apiCall(`space/space/${spaceId}/widgets/`, 'POST', widgetData);
  return res.data;
};

/**
 * Update a widget (full update including config)
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the widget
 * @param {Object} updates - Fields to update (can include config)
 * @returns {Promise<Object>} Updated widget
 */
export const updateSpaceWidget = async (spaceId, widgetId, updates) => {
  const res = await apiCall(`space/space/${spaceId}/widgets/${widgetId}/`, 'PATCH', updates);
  return res.data;
};

/**
 * Update widget configuration only (convenience function for widget state persistence)
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the widget
 * @param {Object} config - Widget configuration object to save
 * @returns {Promise<Object>} Updated widget
 */
export const updateWidgetConfig = async (spaceId, widgetId, config) => {
  const res = await apiCall(`space/space/${spaceId}/widgets/${widgetId}/`, 'PATCH', { config });
  return res.data;
};

/**
 * Remove a widget from a space
 * @param {string} spaceId - UUID of the space
 * @param {string} widgetId - UUID of the widget
 * @returns {Promise<void>}
 */
export const removeSpaceWidget = async (spaceId, widgetId) => {
  await apiCall(`space/space/${spaceId}/widgets/${widgetId}/`, 'DELETE');
};

// ============================================================================
// SPACE COLLABORATION (New Feature)
// ============================================================================

/**
 * Invite a collaborator to a SPACE (not repository)
 * @param {string} spaceId - UUID of the space
 * @param {string} email - Email of user to invite
 * @returns {Promise<Object>} Invitation object
 */
export const inviteSpaceCollaborator = async (spaceId, email) => {
  const res = await apiCall(`space/space/${spaceId}/invite/`, 'POST', { email });
  return res.data;
};

/**
 * List pending invitations for a space (owner only)
 * @param {string} spaceId - UUID of the space
 * @returns {Promise<Array>} Array of invitation objects
 */
export const fetchSpaceInvitations = async (spaceId) => {
  const res = await apiCall(`space/space/${spaceId}/invitations/`, 'GET');
  return res.data || [];
};

/**
 * Accept an invitation to collaborate on a space
 * @param {string} spaceId - UUID of the space
 * @param {string} invitationId - UUID of the invitation
 * @returns {Promise<Object>} Response message
 */
export const acceptSpaceInvitation = async (spaceId, invitationId) => {
  const res = await apiCall(
    `space/space/${spaceId}/invitations/${invitationId}/accept/`,
    'POST'
  );
  return res.data;
};

/**
 * Decline an invitation to collaborate on a space
 * @param {string} spaceId - UUID of the space
 * @param {string} invitationId - UUID of the invitation
 * @returns {Promise<Object>} Response message
 */
export const declineSpaceInvitation = async (spaceId, invitationId) => {
  const res = await apiCall(
    `space/space/${spaceId}/invitations/${invitationId}/decline/`,
    'POST'
  );
  return res.data;
};

/**
 * Remove a collaborator from a SPACE
 * @param {string} spaceId - UUID of the space
 * @param {string} userId - UUID of user to remove
 * @returns {Promise<Object>} Response message
 */
export const removeSpaceCollaborator = async (spaceId, userId) => {
  const res = await apiCall(`space/space/${spaceId}/remove-collaborator/`, 'POST', { user_id: userId });
  return res.data;
};

/**
 * Update collaborator permissions
 * @param {string} spaceId - UUID of the space
 * @param {string} userId - UUID of the user
 * @param {Object} permissions - Permission object
 * @returns {Promise<Object>} Updated permission object
 */
export const updateSpacePermissions = async (spaceId, userId, permissions) => {
  const res = await apiCall(`space/space/${spaceId}/permissions/`, 'POST', {
    user_id: userId,
    permissions
  });
  return res.data;
};

/**
 * Fetch activity log for a space
 * @param {string} spaceId - UUID of the space
 * @returns {Promise<Array>} Array of activity entries
 */
export const fetchSpaceActivity = async (spaceId) => {
  const res = await apiCall(`space/space/${spaceId}/activity/`, 'GET');
  return res.data || [];
};

// ============================================================================
// LIBRARY (Existing Feature)
// ============================================================================

// Get library items for a folder (id=null means root)
export const fetchLibraryItems = async (folderId) => {
  const suffix = folderId ? `?parent=${folderId}` : "";
  const res = await apiCall(`space/workspace/library${suffix}`, "GET");
  return res.data || [];
};

// Upload file to folder
export const uploadLibraryFile = async ({ file, folderId }) => {
  const fd = new FormData();
  fd.append("file", file);
  if (folderId) fd.append("parent", folderId);
  await apiCall("workspace/library/upload/", "POST", fd, "multipart/form-data");
};

// Create new folder
export const createLibraryFolder = async ({ name, folderId }) => {
  const payload = { title: name };
  if (folderId) payload.parent = folderId;
  await apiCall("workspace/library/folder/", "POST", payload);
};

// ============================================================================
// PROJECTS (Existing Feature)
// ============================================================================

export const fetchProjects = async () => {
  const res = await apiCall('space/workspace/projects/', 'GET');
  return res.data || [];
};

// ============================================================================
// REPOSITORIES (Existing Feature - Different from Spaces!)
// ============================================================================

// Fetch all repositories
export const fetchRepositories = async () => {
  const res = await apiCall('space/workspace/repositories/', 'GET');
  return res.data || [];
};

// Create new repository
export const createRepository = async (data) => {
  const res = await apiCall('space/workspace/repositories/', 'POST', data);
  return res.data;
};

// Fetch single repository by ID
export const fetchRepository = async (id) => {
  const res = await apiCall(`space/workspace/repositories/repository/${id}/`);
  return res.data;
};

// Update repository (PATCH)
export const patchRepository = async ({ id, ...data }) => {
  const res = await apiCall(`space/workspace/repositories/${id}/`, 'PATCH', data);
  return res.data;
};

// Delete repository
export const deleteRepository = async (id) => {
  return await apiCall(`space/workspace/repositories/${id}/`, 'DELETE');
};

// Upload files to a repo
export const uploadRepoFiles = async ({ repositoryId, formData }) => {
  const res = await apiCall(
    `space/workspace/repositories/repository/${repositoryId}/upload-structure/`,
    'POST',
    formData,
    'multipart/form-data'
  );
  return res.data;
};

/**
 * Invite collaborator to a REPOSITORY (not Space)
 * @param {Object} params - { repositoryId, email }
 * @returns {Promise<Object>}
 */
export const inviteRepositoryCollaborator = async ({ repositoryId, email }) => {
  return await apiCall(`space/workspace/repositories/${repositoryId}/invite/`, 'POST', { email });
};

// Boards, issues, discussions, etc
export const postRepoItem = async ({ repositoryId, tab, data }) => {
  return await apiCall(`space/workspace/repositories/${repositoryId}/${tab}/`, 'POST', data);
};

// ============================================================================
// WORKSPACE / AI FEATURES (Existing)
// ============================================================================

// Fetch all projects (AI workspace)
export const fetchSpaceProjects = async () => {
  const res = await apiCall('space/spaceWorkspace/projects/', 'GET');
  return Array.isArray(res.data) ? res.data : [];
};

// Run a workflow (POST prompt)
export const runSpaceWorkflow = async ({ prompt }) => {
  const res = await apiCall('space/spaceWorkspace/workflow/', 'POST', { prompt });
  return res.data;
};

// Poll workflow by ID
export const fetchSpaceWorkflowStatus = async (workflowId) => {
  const res = await apiCall(`space/spaceWorkspace/workflow/${workflowId}`, 'GET');
  return res.data;
};

// Project chat (POST)
export const postSpaceProjectChat = async ({ project, message }) => {
  const res = await apiCall('space/spaceWorkspace/project_chat/', 'POST', { project, message });
  return res.data;
};

// ============================================================================
// PROJECT TOOLS (Existing)
// ============================================================================

// Fetch rich text content
export const fetchRichTextContent = async (projectId) => {
  const res = await apiCall(`space/workspace/projects/tools/${projectId}/richtext/`);
  return res.data?.content || "";
};

// Save rich text content
export const saveRichTextContent = async ({ projectId, content }) => {
  const res = await apiCall(
    `space/workspace/projects/tools/${projectId}/richtext/`,
    "PUT",
    { content }
  );
  return res.data;
};

// List all files for a code project
export const fetchCodeFiles = async (projectId) => {
  const res = await apiCall(`space/workspace/projects/tools/${projectId}/code/files/`);
  return res.data || [];
};

// Create a new file
export const createCodeFile = async ({ projectId, filename, language }) => {
  const res = await apiCall(
    `space/workspace/projects/tools/${projectId}/code/files/`,
    "POST",
    { filename, language, content: "" }
  );
  return res.data;
};

// Save/update a file's content
export const saveCodeFileContent = async ({ projectId, fileId, content }) => {
  const res = await apiCall(
    `space/workspace/projects/tools/${projectId}/code/files/${fileId}/`,
    "PUT",
    { content }
  );
  return res.data;
};

// Fetch LaTeX content for a project
export const fetchLatexContent = async (projectId) => {
  const res = await apiCall(`space/workspace/projects/tools/${projectId}/latex/`);
  return res.data.content || "";
};

// Save LaTeX content
export const saveLatexContent = async ({ projectId, content }) => {
  await apiCall(`space/workspace/projects/tools/${projectId}/latex/`, 'PUT', { content });
};

// Compile to PDF (returns blob)
export const compileLatexPDF = async ({ projectId, latex, customFiles }) => {
  const blob = new Blob([latex], { type: "text/plain" });
  const file = new File([blob], "document.tex");
  const formData = new FormData();
  formData.append("tex", file);
  (customFiles || []).forEach(f => formData.append("files", f));
  const response = await apiCall(
    `space/workspace/projects/tools/${projectId}/latex/render/`,
    "POST",
    formData,
    "multipart/form-data",
    null,
    { responseType: "blob" }
  );
  return response.data; // BLOB
};

// Fetch markdown content for a project
export const fetchMarkdownContent = async (projectId) => {
  const res = await apiCall(`/api/tools/${projectId}/markdown/`);
  return res.data.content || "";
};

// Save markdown content for a project
export const saveMarkdownContent = async ({ projectId, content }) => {
  await apiCall(`/api/tools/${projectId}/markdown/`, 'PUT', { content });
};

// Fetch notebook cells for a project
export const fetchNotebookCells = async (projectId) => {
  const res = await apiCall(`/api/tools/${projectId}/notebook/`);
  return res.data.cells || [];
};

// Save notebook cells for a project
export const saveNotebookCells = async ({ projectId, cells }) => {
  await apiCall(`/api/tools/${projectId}/notebook/`, 'PUT', { cells });
};

// Create a new Space project for a tool
export const createSpaceProject = async ({ toolType, toolName }) => {
  const data = {
    title: `${toolName} - ${new Date().toISOString()}`,
    tool_type: toolType,
  };
  const response = await apiCall('space/workspace/projects/', 'POST', data);
  return response.data;
};