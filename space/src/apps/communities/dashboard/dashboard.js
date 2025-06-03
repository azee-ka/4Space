import React from 'react';
import './dashboard.css';

const CommunitiesDashboard = () => {
  const mockChartData = [75, 60, 80, 50, 90, 65, 85];

  const stats = [
    ['Total Communities', '128', '+12 this month', 'positive'],
    ['Active Growth Communities', '86', '67% are expanding', 'positive'],
    ['Engagement Rate', '68%', '↑ from 61% last week', 'positive'],
    ['Avg Posts per User', '3.7', 'weekly average', 'neutral'],
    ['Daily Active Users', '1,327', 'vs 1,201 yesterday', 'neutral'],
    ['Avg Session Duration', '6.7 min', '+12% from last week', 'positive'],
    ['Time to First Response', '2.1h', 'Last 48 hours', 'neutral'],
    ['Moderator Actions/Day', '146', 'avg last 7d', 'positive'],
    ['Reports Resolved', '92%', 'Within SLA', 'positive'],
    ['Content Quality Score', '8.4 / 10', 'flag:feedback ratio', 'positive'],
    ['Moderator Coverage', '93%', 'Communities with active mods', 'neutral'],
    ['Churn Rate', '4.2%', 'users left vs joined', 'danger']
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>Community Command Center</h1>
          <p className="subtitle">Strategic metrics, live activity, and system-wide control</p>
        </div>
        <div className="dashboard-user">
          <span className="user-role">Admin</span>
          <span className="user-avatar">👤</span>
        </div>
      </header>

      {/* Stat Cards */}
      <section className="dashboard-grid">
        {stats.map(([title, value, subtext, type], idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-glow-layer" />
            <div className="stat-content">
              <h3>{title}</h3>
              <p className="main-value">{value}</p>
              <p className={`subtext ${type}`}>{subtext}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Activity Feed + Graph */}
      <section className="dashboard-split">
        <div className="dashboard-panel activity-feed">
          <h2>Live Community Events</h2>
          <ul>
            <li><strong>@Nova</strong> opened a poll in <span className="chip">Cinemaverse</span></li>
            <li><strong>@ZainX</strong> replied in <span className="chip">CryptoCulture</span></li>
            <li><strong>@Visionary</strong> shared media in <span className="chip">Tech Frontiers</span></li>
            <li><strong>@EchoBot</strong> flagged content in <span className="chip">AI Ethics</span></li>
          </ul>
        </div>

        <div className="dashboard-panel graph-panel">
          <h2>Participation Trend</h2>
          <div className="mock-chart">
            <div className="chart-title">📊 Weekly Post & Comment Activity</div>
            <div className="chart-grid">
              {mockChartData.map((value, i) => (
                <div key={i} className="bar-container">
                  <div className="bar" style={{ height: `${value}%` }}></div>
                </div>
              ))}
            </div>
            <div className="chart-labels">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
          </div>
        </div>
      </section>

      {/* Community Intelligence */}
      <section className="dashboard-split">
        <div className="dashboard-panel">
          <h2>User Retention</h2>
          <ul>
            <li><span>🧠 Returning Users</span><span className="highlight">74%</span></li>
            <li><span>📈 Weekly Growth</span><span className="highlight">+9.4%</span></li>
            <li><span>🌍 Session Duration</span><span className="highlight">7.8 min</span></li>
            <li><span>📉 Churn Rate</span><span className="highlight danger">4.2%</span></li>
          </ul>
        </div>

        <div className="dashboard-panel">
          <h2>Content & Quality</h2>
          <ul>
            <li><span>📝 Avg Posts/User</span><span className="highlight">3.7</span></li>
            <li><span>⚖ Flag/Feedback Ratio</span><span className="highlight">1:8</span></li>
            <li><span>⭐ Quality Score</span><span className="highlight">8.4</span></li>
          </ul>
        </div>

        <div className="dashboard-panel">
          <h2>Moderation Ops</h2>
          <ul>
            <li><span>🛡 Active Mods</span><span className="highlight">14</span></li>
            <li><span>⏱ Avg Response</span><span className="highlight">2.1h</span></li>
            <li><span>📊 Actions per Day</span><span className="highlight">146</span></li>
            <li><span>🚨 Escalations</span><span className="highlight danger">7</span></li>
          </ul>
        </div>
      </section>

      {/* Actions */}
      <section className="dashboard-panel action-panel">
        <h2>Quick Tools</h2>
        <div className="action-grid">
          <button>Create Announcement</button>
          <button>Manage Permissions</button>
          <button>Moderate Reports</button>
          <button>Analyze Engagement</button>
          <button>Audit Logs</button>
          <button>Launch New Community</button>
        </div>
      </section>
    </div>
  );
};

export default CommunitiesDashboard;
