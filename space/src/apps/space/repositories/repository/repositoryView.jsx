import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useApi from "../../../../utils/useApi";
import "./repositoryView.css";
import { formatDateTime } from "../../../../utils/formatDateTime";
import UploadModal from "./UploadModal";
import FileExplorer from "./FileExplorer";

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

  const [explorerPath, setExplorerPath] = useState(null);
  // track which file we just clicked
  const [initialFile, setInitialFile] = useState(null);

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

  useEffect(() => {
    fetchRepo();
  }, [repositoryId]);

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

  async function handleUpload(files) {
    try {
      const fd = new FormData();
      files.forEach((file) => {
        // 1) append the actual file
        fd.append("files", file, file.webkitRelativePath || file.name);
        // 2) append its path in the same order
        fd.append("paths", file.webkitRelativePath || file.name);
      });

      const res = await callApi(
        `space/repositories/repository/${repositoryId}/upload-structure/`,
        "POST",
        fd,
        "multipart/form-data"
      );
      console.log("res", res.data);
      fetchRepo();
      setShowUploadModal(false);
    } catch (err) {
      console.error("Error uploadinf struct", err);
    }
  }

  // build a single, memoized file-tree at top level
  const fileTree = useMemo(() => {
    if (!repo) return { children: [] };
    const root = { name: "/", type: "folder", children: [] };
    repo.files.forEach((f) => {
      const parts = f.path.split("/");
      let node = root;
      parts.forEach((seg, i) => {
        const isFile = i === parts.length - 1;
        if (isFile) {
          node.children.push({ name: seg, type: "file", url: f.file_url });
        } else {
          let child = node.children.find(
            (c) => c.type === "folder" && c.name === seg
          );
          if (!child) {
            child = { name: seg, type: "folder", children: [] };
            node.children.push(child);
          }
          node = child;
        }
      });
    });
    return root;
  }, [repo?.files]);

  const rootEntries = fileTree.children;

  function renderTab() {
    if (!repo) {
      return <div className="repo-view__loading">Loading…</div>;
    }

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
        // if we’re drilled in, show explorer
        if (explorerPath !== null) {
          return (
            <FileExplorer
              files={repo.files}
              initialPath={explorerPath}
              onClose={() => {
                setExplorerPath(null);
              }}
            />
          );
        }

        // otherwise show root listing
        return (
          <div className="repo-card">
            <div className="repo-card__header-row">
              <h2 className="repo-card__title">Files</h2>
              <button
                className="repo-card__btn"
                onClick={() => setShowUploadModal(true)}
              >
                Add Files
              </button>
            </div>

            <ul className="repo-root-list">
              {rootEntries.map((e) => (
                <li
                  key={e.name}
                  className={`repo-root-item ${e.type}`}
                  onClick={() => {
                    if (e.type === "folder") {
                      setExplorerPath([e.name]);
                    } else {
                      setExplorerPath([]);
                    }
                  }}
                >
                  <span className="file-icon">
                    {e.type === "folder" ? "📁" : "📄"}
                  </span>
                  <span>{e.name}</span>
                </li>
              ))}
              {rootEntries.length === 0 && <li>(no files)</li>}
            </ul>
          </div>
        );

      case "boards":
      case "issues":
      case "discussions":
        const fieldName =
          tab === "boards"
            ? "taskInput"
            : tab === "issues"
            ? "issueInput"
            : "discussionInput";
        const label = tab[0].toUpperCase() + tab.slice(1);

        return (
          <section className="repo-card">
            <h2 className="repo-card__title">{label}</h2>
            {tab === "discussions" ? (
              <textarea
                name={fieldName}
                placeholder={`New ${tab.slice(0, -1)}...`}
                value={form[fieldName]}
                onChange={handleInputChange}
              />
            ) : (
              <input
                name={fieldName}
                placeholder={`New ${tab.slice(0, -1)}...`}
                value={form[fieldName]}
                onChange={handleInputChange}
              />
            )}
            <button
              onClick={() =>
                handleSubmit(
                  `space/repositories/${repositoryId}/${tab}/`,
                  {
                    [tab === "discussions" ? "content" : "title"]:
                      form[fieldName],
                  },
                  [fieldName]
                )
              }
            >
              {tab === "discussions" ? "Post" : "Add"}
            </button>
            <ul className="repo-list">
              {repo[tab]?.length ? (
                repo[tab].map((item) => (
                  <li key={item.id}>
                    <strong>{item.title || item.content}</strong>
                  </li>
                ))
              ) : (
                <li>No {tab} yet.</li>
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
  }

  return (
    <div className="repo-view__shell">
      {/* === HEADER === */}
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

      {/* === BODY === */}
      <div
        className={`repo-view__layout ${tab === "library" ? "no-sidebar" : ""}`}
      >
        {" "}
        <main className="repo-view__main">{renderTab()}</main>
        {tab !== "library" && (
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
        )}
      </div>

      {showUploadModal && (
        <UploadModal
          onUpload={handleUpload}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}
