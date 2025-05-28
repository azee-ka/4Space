import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useApi from "../../../../utils/useApi";
import "./repositoryView.css";
import { formatDateTime } from "../../../../utils/formatDateTime";

import {
  FaJsSquare,
  FaHtml5,
  FaCss3Alt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaReact,
  FaFileArchive,
  FaFileAlt,
} from "react-icons/fa";
import { MdInsertDriveFile } from "react-icons/md";

const fileIconMap = {
  js: <FaJsSquare />,
  jsx: <FaReact />,
  ts: <FaJsSquare />,
  html: <FaHtml5 />,
  css: <FaCss3Alt />,
  pdf: <FaFilePdf />,
  doc: <FaFileWord />,
  docx: <FaFileWord />,
  xls: <FaFileExcel />,
  xlsx: <FaFileExcel />,
  zip: <FaFileArchive />,
  txt: <FaFileAlt />,
  default: <MdInsertDriveFile />,
};

// usage:
const getFileIcon = (filename) => {
  if (!filename || typeof filename !== "string") return fileIconMap.default;
  const ext = filename.split(".").pop().toLowerCase();
  return fileIconMap[ext] || fileIconMap.default;
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "library", label: "Library" },
  { key: "boards", label: "Boards" },
  { key: "issues", label: "Issues" },
  { key: "discussions", label: "Discussions" },
  { key: "wiki", label: "Wiki" },
  { key: "insights", label: "Insights" },
  { key: "settings", label: "Settings" },
];

export default function RepositoryView() {
  const { repositoryId } = useParams();
  const navigate = useNavigate();
  const { callApi } = useApi();

  const [repo, setRepo] = useState(null);
  const [tab, setTab] = useState("overview");
  const [form, setForm] = useState({
    taskInput: "",
    issueInput: "",
    discussionInput: "",
    inviteEmail: "",
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [newFolderName, setNewFolderName] = useState("");
  const [dragTarget, setDragTarget] = useState(null);

  const [folderStructure, setFolderStructure] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);

  
const handleFileSelect = (e) => {
  const newFiles = Array.from(e.target.files);

  newFiles.forEach((file) => {
    const path = file.webkitRelativePath || file.name;
    const segments = path.split("/");

    if (segments.length > 1) {
      const folderName = segments[0];
      setFolderStructure((prev) => {
        const existing = prev.find((f) => f.name === folderName && f.type === "folder");
        if (existing) {
          const already = existing.children?.some((child) => child.name === file.name);
          if (!already) {
            existing.children.push({ name: file.name, type: "file", file });
          }
          return [...prev];
        } else {
          return [
            ...prev,
            {
              name: folderName,
              type: "folder",
              children: [{ name: file.name, type: "file", file }],
            },
          ];
        }
      });
    } else {
      setSelectedFiles((prev) => {
        const exists = prev.some((f) => f.name === file.name);
        return exists ? prev : [...prev, file];
      });
    }
  });
};


  const handleFileUpload = async () => {
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await callApi(
        `space/repositories/repository/${repositoryId}/upload-files/`,
        "POST",
        formData,
        "multipart/form-data"
      );
      setSelectedFiles([]);
      setShowUploadModal(false);
      fetchRepo();
      console.log(response.data);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  useEffect(() => {
    fetchRepo();
  }, [repositoryId]);

  const fetchRepo = async () => {
    try {
      const res = await callApi(
        `space/repositories/repository/${repositoryId}/`
      );
      setRepo(res.data);
    } catch (err) {
      console.error("Failed to fetch repository:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (url, data, resetKeys = []) => {
    try {
      await callApi(url, "POST", data);
      const updatedForm = { ...form };
      resetKeys.forEach((k) => (updatedForm[k] = ""));
      setForm(updatedForm);
      fetchRepo();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this repository?")) {
      await callApi(`space/repositories/${repositoryId}/`, "DELETE");
      navigate("/space/repositories");
    }
  };

  const handleVisibilityChange = async (e) => {
    try {
      await callApi(`space/repositories/${repositoryId}/`, "PATCH", {
        is_public: e.target.value === "public",
      });
      fetchRepo();
    } catch (err) {
      console.error("Visibility update failed", err);
    }
  };

  const getCurrentFolder = () => {
    let folder = { children: folderStructure };
    for (let name of currentPath) {
      folder = folder.children.find(
        (f) => f.name === name && f.type === "folder"
      );
      if (!folder) break;
    }
    return folder || { children: [] };
  };

  const createFolder = (name) => {
    if (!name.trim()) return;
    const updateRecursive = (folders, depth = 0) =>
      folders.map((folder) => {
        if (
          depth === currentPath.length &&
          folder.name === currentPath[depth - 1]
        ) {
          return {
            ...folder,
            children: [
              ...(folder.children || []),
              { name, type: "folder", children: [] },
            ],
          };
        }
        if (folder.children) {
          return {
            ...folder,
            children: updateRecursive(folder.children, depth + 1),
          };
        }
        return folder;
      });

    if (currentPath.length === 0) {
      setFolderStructure([
        ...folderStructure,
        { name, type: "folder", children: [] },
      ]);
    } else {
      setFolderStructure(updateRecursive(folderStructure));
    }
  };

  const enterFolder = (folderName) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const goBack = () => {
    setCurrentPath((prev) => prev.slice(0, -1));
  };

  const assignFileToFolder = (file) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== file.name));

    const insertRecursive = (folders, pathIndex = 0) => {
      return folders.map((folder) => {
        if (
          folder.type === "folder" &&
          folder.name === currentPath[pathIndex]
        ) {
          if (pathIndex === currentPath.length - 1) {
            // At target folder, insert file
            const alreadyExists = folder.children.some(
              (child) => child.name === file.name
            );
            if (!alreadyExists) {
              return {
                ...folder,
                children: [
                  ...folder.children,
                  { name: file.name, type: "file", file },
                ],
              };
            }
            return folder; // No duplicate
          }

          // Go deeper
          return {
            ...folder,
            children: insertRecursive(folder.children || [], pathIndex + 1),
          };
        }
        return folder;
      });
    };

    setFolderStructure((prev) => insertRecursive(prev));
  };

  const removeFile = (filename) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== filename));
    setFolderStructure((prev) =>
      prev.map((folder) => ({
        ...folder,
        files: folder.files.filter((f) => f.name !== filename),
      }))
    );
  };

  const renderFileTree = () => {
    const currentFolder = getCurrentFolder();

    return (
      <>
        {currentPath.length > 0 && (
          <button className="repo-back-btn" onClick={goBack}>
            ← Back
          </button>
        )}

        {selectedFiles.length > 0 && currentPath.length === 0 && (
          <div className="repo-folder">
            <h4>Unassigned</h4>
            <ul className="repo-list small">
              {selectedFiles.map((file, i) => (
                <li
                  key={i}
                  className="repo-file-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "text/plain",
                      JSON.stringify({ name: file.name })
                    );
                  }}
                >
                  <span className="file-icon">{getFileIcon(file.name)}</span>
                  <span>{file.name}</span>
                  <button
                    className="remove-btn"
                    onClick={() => removeFile(file.name)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {currentFolder.children?.map((entry, i) =>
          entry.type === "folder" ? (
            <div
              key={i}
              className={`repo-folder ${
                dragTarget === entry.name ? "drag-over" : ""
              }`}
              onClick={() => enterFolder(entry.name)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragTarget(entry.name);
              }}
              onDragLeave={() => setDragTarget(null)}
              onDrop={(e) => {
                e.preventDefault();
                const raw = e.dataTransfer.getData("text/plain");
                if (!raw) return;

                let parsed;
                try {
                  parsed = JSON.parse(raw);
                } catch {
                  return;
                }

                const file = selectedFiles.find((f) => f.name === parsed.name);
                if (!file) return;

                assignFileToFolder(file); // No need to pass folder name anymore
                setDragTarget(null);
              }}
            >
              <h4>{entry.name}</h4>
            </div>
          ) : (
            <li key={i} className="repo-file-item">
              <span className="file-icon">{getFileIcon(entry.name)}</span>
              <span>{entry.name}</span>
              <button
                className="remove-btn"
                onClick={() => removeFile(entry.name)}
              >
                ✕
              </button>
            </li>
          )
        )}
      </>
    );
  };

  const renderTab = () => {
    if (!repo) return <div className="repo-view__loading">Loading...</div>;

    switch (tab) {
      case "overview":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Overview</h2>
            <p className="repo-card__desc">
              {repo.description || "No description provided."}
            </p>
            <div className="repo-card__meta">
              <span>
                <strong>Slug:</strong> {repo.slug}
              </span>
              <span>
                <strong>Visibility:</strong>{" "}
                {repo.is_public ? "Public" : "Private"}
              </span>
              <span>
                <strong>Created:</strong>{" "}
                {new Date(repo.created_at).toLocaleString()}
              </span>
            </div>
          </section>
        );

      case "library":
        return (
          <section className="repo-card">
            <div className="repo-card__header-row">
              <h2 className="repo-card__title">Files</h2>
              <button
                className="repo-card__btn"
                onClick={() => setShowUploadModal(true)}
              >
                Add Files
              </button>
            </div>

            <ul className="repo-list">
              {repo.files.length === 0 ? (
                <li>No files available.</li>
              ) : (
                repo.files.map((file) => (
                  <li key={file.item}>
                    <strong>{file.alias || file.item}</strong>
                  </li>
                ))
              )}
            </ul>
          </section>
        );

      case "boards":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Tasks</h2>
            <input
              name="taskInput"
              placeholder="New task..."
              value={form.taskInput}
              onChange={handleInputChange}
            />
            <button
              onClick={() =>
                handleSubmit(
                  `space/repositories/${repositoryId}/tasks/`,
                  { title: form.taskInput },
                  ["taskInput"]
                )
              }
            >
              Add Task
            </button>
            <ul className="repo-list">
              {repo.tasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong> —{" "}
                  {task.is_done ? "Done" : "Pending"}
                </li>
              ))}
            </ul>
          </section>
        );

      case "issues":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Issues</h2>
            <input
              name="issueInput"
              placeholder="New issue..."
              value={form.issueInput}
              onChange={handleInputChange}
            />
            <button
              onClick={() =>
                handleSubmit(
                  `space/repositories/${repositoryId}/issues/`,
                  { title: form.issueInput },
                  ["issueInput"]
                )
              }
            >
              Create Issue
            </button>
            <ul className="repo-list">
              {repo.issues?.length ? (
                repo.issues.map((issue) => (
                  <li key={issue.id}>
                    <strong>{issue.title}</strong>
                  </li>
                ))
              ) : (
                <li>No issues yet.</li>
              )}
            </ul>
          </section>
        );

      case "discussions":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Discussions</h2>
            <textarea
              name="discussionInput"
              placeholder="Start a discussion..."
              value={form.discussionInput}
              onChange={handleInputChange}
            />
            <button
              onClick={() =>
                handleSubmit(
                  `space/repositories/${repositoryId}/discussions/`,
                  { content: form.discussionInput },
                  ["discussionInput"]
                )
              }
            >
              Post
            </button>
            <ul className="repo-list">
              {repo.discussions?.length ? (
                repo.discussions.map((d) => (
                  <li key={d.id}>
                    <strong>{d.content}</strong>
                  </li>
                ))
              ) : (
                <li>No discussions.</li>
              )}
            </ul>
          </section>
        );

      case "wiki":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Wiki</h2>
            <ul className="repo-list">
              {repo.wiki?.length ? (
                repo.wiki.map((p) => (
                  <li key={p.id}>
                    <strong>{p.title}</strong>
                  </li>
                ))
              ) : (
                <li>No wiki pages yet.</li>
              )}
            </ul>
          </section>
        );

      case "insights":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Insights</h2>
            <p>
              <strong>Contributors:</strong> {repo.collaborators.length || 0}
            </p>
            <p>
              <strong>Total Tasks:</strong> {repo.tasks.length || 0}
            </p>
            <p>
              <strong>Total Issues:</strong> {repo.issues?.length || 0}
            </p>
          </section>
        );

      case "settings":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Settings</h2>

            <div className="repo-card__group">
              <label htmlFor="visibility">Visibility:</label>
              <select
                id="visibility"
                value={repo.is_public ? "public" : "private"}
                onChange={handleVisibilityChange}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="repo-card__group">
              <h3>Collaborators</h3>
              <input
                name="inviteEmail"
                placeholder="Email"
                value={form.inviteEmail}
                onChange={handleInputChange}
              />
              <button
                onClick={() =>
                  handleSubmit(
                    `space/repositories/${repositoryId}/invite/`,
                    { email: form.inviteEmail },
                    ["inviteEmail"]
                  )
                }
              >
                Invite
              </button>
            </div>

            <div className="repo-card__group">
              <h3>Danger Zone</h3>
              <button className="repo-view__btn--danger" onClick={handleDelete}>
                Delete Repository
              </button>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="repo-view__shell">
      {/* === TOP: HEADER === */}
      <div className="repo-view__header-bar">
        <div className="repo-view__title-block">
          <div className="repo-view__title-row">
            <h1 className="repo-view__title">{repo?.title || "Repository"}</h1>
            <span className="repo-view__visibility">
              {repo?.is_public ? "Public" : "Private"}
            </span>
          </div>
          <div className="repo-view__slug-chip">{repo?.slug}</div>
        </div>
        <div className="repo-view__created">
          Created on {formatDateTime(repo?.created_at)}
        </div>
      </div>

      {/* === NAV === */}
      <div className="repo-view__tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`repo-view__tab ${
              tab === t.key ? "repo-view__tab--active" : ""
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* === MAIN BODY === */}
      <div className="repo-view__layout">
        {/* MAIN CONTENT */}
        <main className="repo-view__main">{renderTab()}</main>

        {/* SIDEBAR */}
        <aside className="repo-view__sidebar">
          <div className="repo-card">
            <h4 className="repo-card__title">Collaborators</h4>
            <ul className="repo-list">
              {repo?.collaborators?.length ? (
                repo.collaborators.map((c) => (
                  <li key={c.email}>
                    <strong>{c.username}</strong> — {c.email}
                  </li>
                ))
              ) : (
                <li>No collaborators yet.</li>
              )}
            </ul>
          </div>

          <div className="repo-card">
            <h4 className="repo-card__title">Tags</h4>
            <p>{repo?.tags || "None"}</p>
          </div>

          <div className="repo-card">
            <h4 className="repo-card__title">Actions</h4>
            <button className="repo-view__btn--danger" onClick={handleDelete}>
              Delete Repository
            </button>
          </div>
        </aside>
      </div>
      {showUploadModal && (
        <div
          className="repo-modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="repo-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Upload Files</h3>

            <div
              className="repo-drop-zone"
              onClick={() => document.getElementById("upload-files").click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = Array.from(e.dataTransfer.files);
                handleFileSelect({ target: { files: dropped } });
              }}
            >
              <p>Click or drag files/folders here to add</p>
              <input
                id="upload-files"
                type="file"
                multiple
                webkitdirectory="true"
                directory=""
                className="repo-file-input"
                onChange={handleFileSelect}
              />
            </div>

            <div className="repo-folder-bar">
              <input
                placeholder="New folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <button onClick={() => createFolder(newFolderName)}>
                + Add Folder
              </button>
            </div>

            <div className="repo-file-tree">{renderFileTree()}</div>

            <div className="repo-modal__actions">
              <button onClick={handleFileUpload}>Upload</button>
              <button
                className="cancel"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
