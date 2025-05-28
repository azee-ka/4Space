import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useApi from "../../../../utils/useApi";
import "./repositoryView.css";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "code", label: "Code" },
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

  useEffect(() => {
    fetchRepo();
  }, [repositoryId]);

  const fetchRepo = async () => {
    try {
      const res = await callApi(`space/repositories/repository/${repositoryId}/`);
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
      resetKeys.forEach(k => updatedForm[k] = "");
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

  const renderTab = () => {
    if (!repo) return <div className="repo-view__loading">Loading...</div>;

    switch (tab) {
      case "overview":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Overview</h2>
            <p className="repo-card__desc">{repo.description || "No description provided."}</p>
            <div className="repo-card__meta">
              <span><strong>Slug:</strong> {repo.slug}</span>
              <span><strong>Visibility:</strong> {repo.is_public ? "Public" : "Private"}</span>
              <span><strong>Created:</strong> {new Date(repo.created_at).toLocaleString()}</span>
            </div>
          </section>
        );

      case "code":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Files</h2>
            <ul className="repo-list">
              {repo.files.length === 0 ? <li>No files available.</li> : repo.files.map((file) => (
                <li key={file.item}><strong>{file.alias || file.item}</strong></li>
              ))}
            </ul>
          </section>
        );

      case "boards":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Tasks</h2>
            <input name="taskInput" placeholder="New task..." value={form.taskInput} onChange={handleInputChange} />
            <button onClick={() => handleSubmit(`space/repositories/${repositoryId}/tasks/`, { title: form.taskInput }, ["taskInput"])}>Add Task</button>
            <ul className="repo-list">
              {repo.tasks.map(task => (
                <li key={task.id}>
                  <strong>{task.title}</strong> — {task.is_done ? "Done" : "Pending"}
                </li>
              ))}
            </ul>
          </section>
        );

      case "issues":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Issues</h2>
            <input name="issueInput" placeholder="New issue..." value={form.issueInput} onChange={handleInputChange} />
            <button onClick={() => handleSubmit(`space/repositories/${repositoryId}/issues/`, { title: form.issueInput }, ["issueInput"])}>Create Issue</button>
            <ul className="repo-list">
              {repo.issues?.length
                ? repo.issues.map(issue => (
                  <li key={issue.id}><strong>{issue.title}</strong></li>
                ))
                : <li>No issues yet.</li>}
            </ul>
          </section>
        );

      case "discussions":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Discussions</h2>
            <textarea name="discussionInput" placeholder="Start a discussion..." value={form.discussionInput} onChange={handleInputChange} />
            <button onClick={() => handleSubmit(`space/repositories/${repositoryId}/discussions/`, { content: form.discussionInput }, ["discussionInput"])}>Post</button>
            <ul className="repo-list">
              {repo.discussions?.length
                ? repo.discussions.map(d => (
                    <li key={d.id}><strong>{d.content}</strong></li>
                  ))
                : <li>No discussions.</li>}
            </ul>
          </section>
        );

      case "wiki":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Wiki</h2>
            <ul className="repo-list">
              {repo.wiki?.length
                ? repo.wiki.map(p => <li key={p.id}><strong>{p.title}</strong></li>)
                : <li>No wiki pages yet.</li>}
            </ul>
          </section>
        );

      case "insights":
        return (
          <section className="repo-card">
            <h2 className="repo-card__title">Insights</h2>
            <p><strong>Contributors:</strong> {repo.collaborators.length}</p>
            <p><strong>Total Tasks:</strong> {repo.tasks.length}</p>
            <p><strong>Total Issues:</strong> {repo.issues?.length || 0}</p>
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
    <button onClick={() =>
      handleSubmit(
        `space/repositories/${repositoryId}/invite/`,
        { email: form.inviteEmail },
        ["inviteEmail"]
      )
    }>
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
        <div className="repo-view__title-group">
          <h1 className="repo-view__title">{repo?.title || "Repository"}</h1>
          <span className="repo-view__visibility">{repo?.is_public ? "Public" : "Private"}</span>
        </div>
        <div className="repo-view__subtitle">
          <code>{repo?.slug}</code> • Created: {new Date(repo?.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* === NAV === */}
      <div className="repo-view__tab-bar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`repo-view__tab ${tab === t.key ? "repo-view__tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* === MAIN BODY === */}
      <div className="repo-view__layout">
        {/* MAIN CONTENT */}
        <main className="repo-view__main">
          {renderTab()}
        </main>

        {/* SIDEBAR */}
        <aside className="repo-view__sidebar">
          <div className="repo-card">
            <h4 className="repo-card__title">Collaborators</h4>
            <ul className="repo-list">
              {repo?.collaborators?.length
                ? repo.collaborators.map(c => (
                    <li key={c.email}><strong>{c.username}</strong> — {c.email}</li>
                  ))
                : <li>No collaborators yet.</li>}
            </ul>
          </div>

          <div className="repo-card">
            <h4 className="repo-card__title">Tags</h4>
            <p>{repo?.tags || "None"}</p>
          </div>

          <div className="repo-card">
            <h4 className="repo-card__title">Actions</h4>
            <button className="repo-view__btn--danger" onClick={handleDelete}>Delete Repository</button>
          </div>
        </aside>
      </div>
    </div>
  );
}