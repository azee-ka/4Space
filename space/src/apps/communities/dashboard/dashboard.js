import React from 'react';
import './dashboard.css';

const CommunitiesDashboard = () => {
  return (
    <div className="communities-dashboard-page">
      <div className="communities-dashboard-header">
        <h2>Community Dashboard</h2>
        <div className="dashboard-user">
          <span className="user-role">Moderator</span>
          <span className="user-avatar">👤</span>
        </div>
      </div>

      <div className="dashboard-cards-row">
        <div className="dashboard-card"><h4>Total Communities</h4><p>128</p></div>
        <div className="dashboard-card"><h4>Active Posts Today</h4><p>342</p></div>
        <div className="dashboard-card"><h4>New Members</h4><p>87</p></div>
        <div className="dashboard-card"><h4>Pending Reports</h4><p>5</p></div>
      </div>

      <div className="dashboard-section-row">
        <div className="dashboard-panel recent-activity">
          <h3>Recent Activity</h3>
          <ul>
            <li><strong>@DesignDiva</strong> joined <span className="chip">Creative Minds</span></li>
            <li><strong>@DevMark</strong> posted in <span className="chip">React Wizards</span></li>
            <li><strong>@AlexQ</strong> reported a comment in <span className="chip">DebateHub</span></li>
            <li><strong>@Skye</strong> created new <span className="chip">AI Ethics</span></li>
          </ul>
        </div>

        <div className="dashboard-panel graph-panel">
          <h3>Member Growth</h3>
          <div className="graph-placeholder">📈 Graph Placeholder</div>
        </div>
      </div>

      <div className="dashboard-section-row">
        <div className="dashboard-panel top-communities">
          <h3>Top Communities</h3>
          <div className="chip-row">
            <span className="chip large">Tech Frontiers</span>
            <span className="chip large">Cinemaverse</span>
            <span className="chip large">Space Explorers</span>
            <span className="chip large">CryptoCulture</span>
          </div>
        </div>

        <div className="dashboard-panel reports">
          <h3>Report Summary</h3>
          <p>🚩 3 flagged in <span className="chip">React Wizards</span></p>
          <p>🚩 1 spam in <span className="chip">Tech Frontiers</span></p>
          <p>✅ 4 resolved this week</p>
        </div>

        <div className="dashboard-panel moderators">
          <h3>Moderators</h3>
          <ul>
            <li>@Kara - 54 actions</li>
            <li>@Eliot - 39 actions</li>
            <li>@Nova - 33 actions</li>
          </ul>
        </div>
      </div>

      <div className="dashboard-panel actions">
        <h3>Quick Actions</h3>
        <div className="button-grid">
          <button>📎 Create Post</button>
          <button>🛠 Manage Roles</button>
          <button>🏁 Review Reports</button>
          <button>📊 View Stats</button>
          <button>🌐 Discover Communities</button>
          <button>🚀 Launch New Community</button>
        </div>
      </div>
    </div>
  );
};

export default CommunitiesDashboard;
