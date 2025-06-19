import apiCall from "../utils/api";





// Get library items for a folder (id=null means root)
export const fetchLibraryItems = async (folderId) => {
  const suffix = folderId ? `?parent=${folderId}` : "";
  const res = await apiCall(`space/library${suffix}`, "GET");
  return res.data || [];
};

// Upload file to folder
export const uploadLibraryFile = async ({ file, folderId }) => {
  const fd = new FormData();
  fd.append("file", file);
  if (folderId) fd.append("parent", folderId);
  await apiCall("space/library/upload/", "POST", fd, "multipart/form-data");
};

// Create new folder
export const createLibraryFolder = async ({ name, folderId }) => {
  const payload = { title: name };
  if (folderId) payload.parent = folderId;
  await apiCall("space/library/folder/", "POST", payload);
};








export const fetchProjects = async () => {
  const res = await apiCall('space/projects/', 'GET');
  return res.data || [];
};




// Fetch all repositories
export const fetchRepositories = async () => {
  const res = await apiCall('space/repositories/', 'GET');
  return res.data || [];
};

// Create new repository
export const createRepository = async (data) => {
  const res = await apiCall('space/repositories/', 'POST', data);
  return res.data;
};

// Fetch single repository by ID
export const fetchRepository = async (id) => {
  const res = await apiCall(`space/repositories/repository/${id}/`);
  return res.data;
};

// Update repository (PATCH)
export const patchRepository = async ({ id, ...data }) => {
  const res = await apiCall(`space/repositories/${id}/`, 'PATCH', data);
  return res.data;
};

// Delete repository
export const deleteRepository = async (id) => {
  return await apiCall(`space/repositories/${id}/`, 'DELETE');
};

// Upload files to a repo
export const uploadRepoFiles = async ({ repositoryId, formData }) => {
  const res = await apiCall(
    `space/repositories/repository/${repositoryId}/upload-structure/`,
    'POST',
    formData,
    'multipart/form-data'
  );
  return res.data;
};

// Invite collaborator
export const inviteCollaborator = async ({ repositoryId, email }) => {
  return await apiCall(`space/repositories/${repositoryId}/invite/`, 'POST', { email });
};

// Boards, issues, discussions, etc
export const postRepoItem = async ({ repositoryId, tab, data }) => {
  return await apiCall(`space/repositories/${repositoryId}/${tab}/`, 'POST', data);
};






// Fetch all projects
export const fetchSpaceProjects = async () => {
  const res = await apiCall('space/space/projects/', 'GET');
  return Array.isArray(res.data) ? res.data : [];
};

// Run a workflow (POST prompt)
export const runSpaceWorkflow = async ({ prompt }) => {
  const res = await apiCall('space/space/workflow/', 'POST', { prompt });
  return res.data;
};

// Poll workflow by ID
export const fetchSpaceWorkflowStatus = async (workflowId) => {
  const res = await apiCall(`space/space/workflow/${workflowId}`, 'GET');
  return res.data;
};

// Project chat (POST)
export const postSpaceProjectChat = async ({ project, message }) => {
  const res = await apiCall('space/space/project_chat/', 'POST', { project, message });
  return res.data;
};









// Fetch rich text content
export const fetchRichTextContent = async (projectId) => {
  const res = await apiCall(`space/projects/tools/${projectId}/richtext/`);
  return res.data?.content || "";
};

// Save rich text content
export const saveRichTextContent = async ({ projectId, content }) => {
  const res = await apiCall(
    `space/projects/tools/${projectId}/richtext/`,
    "PUT",
    { content }
  );
  return res.data;
};








// List all files for a code project
export const fetchCodeFiles = async (projectId) => {
  const res = await apiCall(`space/projects/tools/${projectId}/code/files/`);
  return res.data || [];
};

// Create a new file
export const createCodeFile = async ({ projectId, filename, language }) => {
  const res = await apiCall(
    `space/projects/tools/${projectId}/code/files/`,
    "POST",
    { filename, language, content: "" }
  );
  return res.data;
};

// Save/update a file's content
export const saveCodeFileContent = async ({ projectId, fileId, content }) => {
  const res = await apiCall(
    `space/projects/tools/${projectId}/code/files/${fileId}/`,
    "PUT",
    { content }
  );
  return res.data;
};









// Fetch LaTeX content for a project
export const fetchLatexContent = async (projectId) => {
  const res = await apiCall(`space/projects/tools/${projectId}/latex/`);
  return res.data.content || "";
};

// Save LaTeX content
export const saveLatexContent = async ({ projectId, content }) => {
  await apiCall(`space/projects/tools/${projectId}/latex/`, 'PUT', { content });
};

// Compile to PDF (returns blob)
export const compileLatexPDF = async ({ projectId, latex, customFiles }) => {
  const blob = new Blob([latex], { type: "text/plain" });
  const file = new File([blob], "document.tex");
  const formData = new FormData();
  formData.append("tex", file);
  (customFiles || []).forEach(f => formData.append("files", f));
  const response = await apiCall(
    `space/projects/tools/${projectId}/latex/render/`,
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
  const response = await apiCall('space/projects/', 'POST', data);
  return response.data;
};
