import React from 'react';
import './spaceDashboard.css';

const SpaceDashboard = () => {
  const stats = [
    { label: 'Projects', value: '12', detail: '3 active this week', status: 'positive' },
    { label: 'Tasks', value: '47', detail: '8 due today', status: 'danger' },
    { label: 'Storage', value: '3.2 GB', detail: 'out of 15 GB', status: 'neutral' },
    { label: 'Repositories', value: '9', detail: 'Last pushed 4h ago', status: 'neutral' },
    { label: 'Files', value: '482', detail: '97 notes, 18 zips, 34 PDFs', status: 'neutral' },
    { label: 'Deployments', value: '3 live', detail: '1 in build', status: 'neutral' },
    { label: 'Tools Used', value: '6', detail: 'Markdown, Code, LaTeX...', status: 'positive' },
    { label: 'Portfolio Views', value: '1,230', detail: 'last 30 days', status: 'positive' }
  ];

  const activity = [
    { title: 'orion-cli', type: 'Created', context: 'Repositories' },
    { title: 'thesis-final.md', type: 'Edited', context: 'Research folder' },
    { title: 'workspace-utils', type: 'Committed', context: 'Repo' },
    { title: 'Portfolio', type: 'Published', context: 'Website update' },
  ];

  const tools = [
    { name: 'Markdown Editor', metric: '3 notes created' },
    { name: 'Code Editor', metric: '6 sessions this week' },
    { name: 'LaTeX Editor', metric: '2 docs compiled' },
    { name: 'AI Assistant', metric: '5 task assists' },
  ];

  const files = {
    total: 482,
    folders: 28,
    formats: ['PDFs: 34', 'Zips: 18', 'Notes: 97']
  };

  const deployments = [
    { domain: 'portfolio.space.dev', status: 'Live' },
    { domain: 'latex-exporter.space.dev', status: 'Deployed' },
    { domain: 'dashboard-ui.space.dev', status: 'Building' }
  ];

  const tasks = [
    'Finalize README for orion-cli',
    'Organize files in /archive',
    'Write project summary for portfolio'
  ];

  return (
    <div className="space-dashboard-page">
      <header className="space-dashboard-header">
        <div>
          <h1>Space Dashboard</h1>
          <p className="space-dashboard-subtitle">
            Your workspace, tools, and productivity status in one place
          </p>
        </div>
        <div className="space-dashboard-user">
          <span className="label">Account</span>
          <span className="value">Professional</span>
        </div>
      </header>

      {/* Stat Cards */}
      <section className="space-dashboard-grid">
        {stats.map(({ label, value, detail, status }, i) => (
          <div key={i} className="space-card">
            <div className="space-card-blur" />
            <div className="space-card-content">
              <h3>{label}</h3>
              <p className="stat">{value}</p>
              <p className={`meta ${status}`}>{detail}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Activity + Tool Usage */}
      <section className="space-dashboard-split">
        <div className="space-panel">
          <div className="space-panel-blur" />
          <h2>Recent Activity</h2>
          <div className="space-items">
            {activity.map((item, i) => (
              <div key={i} className="space-item">
                <span className="pill">{item.type}</span>
                <span className="text">
                  <strong>{item.title}</strong> in {item.context}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-panel">
          <div className="space-panel-blur" />
          <h2>Tool Usage Summary</h2>
          <div className="space-items">
            {tools.map((tool, i) => (
              <div key={i} className="space-item">
                <span className="tag">{tool.name}</span>
                <span className="text">{tool.metric}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* File System + Deployments + Tasks */}
      <section className="space-dashboard-split">
        <div className="space-panel">
          <div className="space-panel-blur" />
          <h2>File System</h2>
          <div className="space-items">
            <div className="space-item"><strong>Total Files:</strong> {files.total}</div>
            <div className="space-item"><strong>Folders:</strong> {files.folders}</div>
            <div className="space-item tags">
              {files.formats.map((f, i) => (
                <span className="pill secondary" key={i}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-panel">
          <div className="space-panel-blur" />
          <h2>Live Deployments</h2>
          <div className="space-items">
            {deployments.map((dep, i) => (
              <div key={i} className="space-item">
                <strong>{dep.domain}</strong>
                <span className={`status-badge ${dep.status.toLowerCase()}`}>{dep.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-panel">
          <div className="space-panel-blur" />
          <h2>Upcoming Tasks</h2>
          <ul className="space-list">
            {tasks.map((task, i) => (
              <li key={i}>{task}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Actions */}
      <section className="space-panel space-tools">
        <div className="space-panel-blur" />
        <h2>Quick Actions</h2>
        <div className="space-action-grid">
          <button>New Project</button>
          <button>Open Code Editor</button>
          <button>Upload File</button>
          <button>Create Task</button>
          <button>Launch Terminal</button>
          <button>View Portfolio</button>
        </div>
      </section>
    </div>
  );
};

export default SpaceDashboard;
