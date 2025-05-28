const RepoTasks = ({ repo }) => (
  <div className="repo-section">
    <button className="repo-action-btn">+ New Task</button>
    {repo.tasks.map((t) => (
      <div key={t.id} className="repo-item">
        <strong>{t.title}</strong> – {t.is_done ? "✅" : "⏳"}<br />
        <small>{t.description}</small>
      </div>
    ))}
  </div>
);
export default RepoTasks;
