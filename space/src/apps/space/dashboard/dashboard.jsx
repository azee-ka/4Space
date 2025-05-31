import React from "react";
import "./spaceDashboard.scss";

const SpaceDashboard = () => {
  const statsByCategory = [
    {
      title: "Productivity",
      key: "productivity",
      items: [
        {
          label: "Projects",
          value: "12",
          detail: "3 active this week • ↑12% from last week",
          status: "positive",
          extra: "Major progress in 2 ongoing capstones",
        },
        {
          label: "Tasks",
          value: "47",
          detail: "8 due today • 22 completed this week",
          status: "danger",
          extra: "3 are overdue • Avg completion time: 2.1d",
        },
        {
          label: "Focus Time",
          value: "5.3 hrs",
          detail: "Avg per day • ↑18% from last week",
          status: "positive",
          extra: "Best streak: 4.7h on Thursday",
        },
        {
          label: "Time Saved",
          value: "7.4 hrs",
          detail: "Est. from automation & AI assists",
          status: "highlight",
          extra: "Top saver: deployment pipeline",
        },
        {
          label: "Sessions",
          value: "42",
          detail: "This week • Peak: Tuesday",
          status: "neutral",
          extra: "Avg session: 38 mins",
        },
      ],
    },
    {
      title: "Tooling & Intelligence",
      key: "tools",
      items: [
        {
          label: "AI Queries",
          value: "18",
          detail: "4 saved snippets • 2 code refactors",
          status: "positive",
          extra: "Biggest gain: CLI optimization",
        },
        {
          label: "Tools Used",
          value: "6",
          detail: "Markdown, Code, LaTeX, AI Assistant...",
          status: "positive",
          extra: "3 used daily • AI used 18 times",
        },
        {
          label: "Notes",
          value: "97",
          detail: "6 added today • ↑15% from last week",
          status: "positive",
          extra: "Most active tag: #research",
        },
      ],
    },
    {
      title: "Engagement & Delivery",
      key: "engagement",
      items: [
        {
          label: "Portfolio Views",
          value: "1,230",
          detail: "last 30 days • ↑9.5% MoM",
          status: "positive",
          extra: "Top referrer: GitHub profile",
        },
        {
          label: "Deployments",
          value: "3 live",
          detail: "1 in build • All healthy",
          status: "positive",
          extra: "Average uptime: 99.97%",
        },
        {
          label: "Repositories",
          value: "9",
          detail: "Last pushed 4h ago • 4 collaborators",
          status: "neutral",
          extra: "Active: 5 • Stale: 2",
        },
      ],
    },
    {
      title: "System & Files",
      key: "system",
      items: [
        {
          label: "Files",
          value: "482",
          detail: "97 notes, 18 zips, 34 PDFs",
          status: "neutral",
          extra: "Tagged: 64% • Synced: 88%",
        },
        {
          label: "Storage",
          value: "3.2 GB",
          detail: "out of 15 GB • 78% media-heavy",
          status: "neutral",
          extra: "Consider archiving old zip archives",
        },
        {
          label: "Sync Rate",
          value: "92%",
          detail: "Cross-device • 3 issues detected",
          status: "neutral",
          extra: "Last sync: 45 mins ago",
        },
        {
          label: "Errors Logged",
          value: "12",
          detail: "↓20% from previous week",
          status: "danger",
          extra: "Most from LaTeX exports",
        },
      ],
    },
  ];

  const activity = [
    { title: "orion-cli", type: "Created", context: "Repositories" },
    { title: "thesis-final.md", type: "Edited", context: "Research folder" },
    { title: "workspace-utils", type: "Committed", context: "Repo" },
    { title: "Portfolio", type: "Published", context: "Website update" },
  ];

  const tools = [
    {
      name: "Markdown Editor",
      metric: "3 notes created",
      extra: "Most used on Thu • Total words: 3,412",
    },
    {
      name: "Code Editor",
      metric: "6 sessions this week",
      extra: "Used for Orion, Dashboard • 14 commits",
    },
    {
      name: "LaTeX Editor",
      metric: "2 docs compiled",
      extra: "Exported 5x PDFs • 1 error detected",
    },
    {
      name: "AI Assistant",
      metric: "5 task assists",
      extra: "Recommended optimizations for CLI project",
    },
  ];

  const files = {
    total: 482,
    folders: 28,
    formats: ["PDFs: 34", "Zips: 18", "Notes: 97"],
  };

  const deployments = [
    { domain: "portfolio.space.dev", status: "Live" },
    { domain: "latex-exporter.space.dev", status: "Deployed" },
    { domain: "dashboard-ui.space.dev", status: "Building" },
  ];

  const tasks = [
    "Finalize README for orion-cli",
    "Organize files in /archive",
    "Write project summary for portfolio",
  ];

  const workspaceHealth = [
    { label: "Sync Issues", value: "3 unresolved" },
    { label: "Backup Status", value: "Last backed up 12h ago" },
    { label: "Uptime", value: "99.97% (past 30 days)" },
    { label: "Alerts", value: "1 critical • 2 warnings" },
  ];

  const goalsMilestones = [
    { label: "May Goals", value: "5 / 7 completed" },
    { label: "Next Deadline", value: "June 4 – Project Orion Summary" },
    { label: "Milestones", value: "Dashboard Alpha delivered ✅" },
  ];

  const suggestions = [
    "📌 Organize archived zip files to reclaim ~1.2GB",
    "🔄 Sync Markdown folder — 3 files stale",
    "🚀 Enable auto-backup for deployments folder",
  ];

  const panelGroups = [
    {
      title: "Workspace Overview",
      key: "overview",
      panels: [
        {
          title: "Recent Activity",
          items: [
            { type: "Created", title: "orion-cli", context: "Repositories" },
            {
              type: "Edited",
              title: "thesis-final.md",
              context: "Research folder",
            },
            { type: "Committed", title: "workspace-utils", context: "Repo" },
            {
              type: "Published",
              title: "Portfolio",
              context: "Website update",
            },
          ],
          render: (items) => (
            <div className="space-items">
              {items.map((item, i) => (
                <div key={i} className="space-item">
                  <span className="pill">{item.type}</span>
                  <span className="text">
                    <strong>{item.title}</strong> in {item.context}
                  </span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Tool Usage Summary",
          items: [
            {
              name: "Markdown Editor",
              metric: "3 notes created",
              extra: "Most used on Thu • Total words: 3,412",
            },
            {
              name: "Code Editor",
              metric: "6 sessions this week",
              extra: "Used for Orion, Dashboard • 14 commits",
            },
            {
              name: "LaTeX Editor",
              metric: "2 docs compiled",
              extra: "Exported 5x PDFs • 1 error detected",
            },
            {
              name: "AI Assistant",
              metric: "5 task assists",
              extra: "Recommended optimizations for CLI project",
            },
          ],
          render: (items) => (
  <div className="tool-table">
    {items.map((tool, i) => (
      <div key={i} className="tool-row">
        <div className="tool-name">{tool.name}</div>
        <div className="tool-metric">{tool.metric}</div>
        <div className="tool-extra">{tool.extra}</div>
      </div>
    ))}
  </div>
)
        },
      ],
    },
    {
      title: "Project Data & Files",
      key: "files",
      panels: [
        {
          title: "File System",
          items: {
            total: 482,
            folders: 28,
            formats: ["PDFs: 34", "Zips: 18", "Notes: 97"],
          },
          render: ({ total, folders, formats }) => (
            <div className="space-items">
              <div className="space-item">
                <strong>Total Files:</strong> {total}
              </div>
              <div className="space-item">
                <strong>Folders:</strong> {folders}
              </div>
              <div className="space-item tags">
                {formats.map((f, i) => (
                  <span className="pill secondary" key={i}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ),
        },
        {
          title: "Live Deployments",
          items: [
            { domain: "portfolio.space.dev", status: "Live" },
            { domain: "latex-exporter.space.dev", status: "Deployed" },
            { domain: "dashboard-ui.space.dev", status: "Building" },
          ],
          render: (items) => (
            <div className="space-items">
              {items.map((dep, i) => (
                <div key={i} className="space-item">
                  <strong>{dep.domain}</strong>
                  <span className={`status-badge ${dep.status.toLowerCase()}`}>
                    {dep.status}
                  </span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Upcoming Tasks",
          items: [
            "Finalize README for orion-cli",
            "Organize files in /archive",
            "Write project summary for portfolio",
          ],
          render: (items) => (
            <ul className="space-list">
              {items.map((task, i) => (
                <li key={i}>{task}</li>
              ))}
            </ul>
          ),
        },
      ],
    },
    {
      title: "System Status & Guidance",
      key: "system",
      panels: [
        {
          title: "Workspace Health",
          items: [
            { label: "Sync Issues", value: "3 unresolved" },
            { label: "Backup Status", value: "Last backed up 12h ago" },
            { label: "Uptime", value: "99.97% (past 30 days)" },
            { label: "Alerts", value: "1 critical • 2 warnings" },
          ],
          render: (items) => (
            <div className="space-items">
              {items.map((item, i) => (
                <div key={i} className="space-item">
                  <strong>{item.label}:</strong> {item.value}
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Goals & Milestones",
          items: [
            { label: "May Goals", value: "5 / 7 completed" },
            { label: "Next Deadline", value: "June 4 – Project Orion Summary" },
            { label: "Milestones", value: "Dashboard Alpha delivered ✅" },
          ],
          render: (items) => (
            <div className="space-items">
              {items.map((goal, i) => (
                <div key={i} className="space-item">
                  <strong>{goal.label}:</strong> {goal.value}
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Insights & Suggestions",
          items: [
            "📌 Organize archived zip files to reclaim ~1.2GB",
            "🔄 Sync Markdown folder — 3 files stale",
            "🚀 Enable auto-backup for deployments folder",
          ],
          render: (items) => (
  <ul className="suggestion-list">
    {items.map((tip, i) => (
      <li key={i} className="suggestion-item">{tip}</li>
    ))}
  </ul>
)
        },
      ],
    },
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
      <section className="space-dashboard-sectioned">
        {statsByCategory.map((category) => (
          <div key={category.key} className="space-dashboard-section">
            <h3 className="space-dashboard-section-title">{category.title}</h3>
            <div className="space-dashboard-card-row">
              {category.items.map(
                ({ label, value, detail, status, extra }, i) => (
                  <div key={i} className="space-card">
                    <div className="space-card-blur" />
                    <div className="space-card-content">
                      <h3>{label}</h3>
                      <p className="stat">{value}</p>
                      <p className={`meta ${status}`}>{detail}</p>
                      <p className="extra-info">{extra}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Divider between cards and panels */}
      <hr className="space-dashboard-divider" />
      <h2 className="space-dashboard-panel-group-title">Workspace Insights</h2>

      {/* Dynamic Panels */}
      {panelGroups.map((group) => (
        <section key={group.key} className="space-dashboard-split">
          {group.panels.map((panel, i) => (
            <div key={i} className="space-panel">
              <div className="space-panel-blur" />
              <h2 className="space-card-content-title">
                {panel.title.toUpperCase()}
              </h2>
              {panel.render(panel.items)}
            </div>
          ))}
        </section>
      ))}

      {/* Quick Actions */}
      <section className="space-panel space-tools">
        <div className="space-panel-blur" />
        <h2 className="space-card-content-title">QUICK ACTIONS</h2>
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
