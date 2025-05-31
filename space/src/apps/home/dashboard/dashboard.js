import React from 'react';
import './dashboard.scss';

const Dashboard = () => {
  const postsPerDay = [40, 55, 70, 85, 50, 65, 95];
  const statCards = [
    ['Total Posts', '1,242', '+12 this week', 'positive'],
    ['Avg Likes/Post', '134', '↑ from 121', 'positive'],
    ['Impressions', '24.6k', '7-day total', 'neutral'],
    ['Engagement Rate', '72%', 'last 30 days', 'positive'],
    ['Top Hashtag', '#BuildInPublic', 'Used 91x', 'neutral'],
    ['Most Saved Post', 'Post #1121', '58 saves', 'highlight'],
    ['Content Format: Images', '61%', 'dominant type', 'neutral'],
    ['Video View Rate', '38%', 'on all reels', 'neutral'],
  ];

  return (
    <div className="home-dashboard-page">
      <header className="home-dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="home-dashboard-subtitle">
            Welcome back. Your content insights & performance at a glance.
          </p>
        </div>
        <div className="home-dashboard-user">
          <span className="role">Creator</span>
          <span className="avatar">📸</span>
        </div>
      </header>

      <section className="home-dashboard-stats-grid">
        {statCards.map(([title, value, info, status], i) => (
          <div key={i} className="home-dashboard-card">
            <div className="home-dashboard-blur-layer" />
            <div className="home-dashboard-card-content">
              <h3>{title}</h3>
              <p className="metric-value">{value}</p>
              <p className={`metric-subtext ${status}`}>{info}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="home-dashboard-split">
        <div className="home-dashboard-panel graph-panel">
          <h2>Weekly Post Activity</h2>
          <div className="home-dashboard-chart">
            <div className="chart-title">Posts per Day</div>
            <div className="chart-bars">
              {postsPerDay.map((val, i) => (
                <div key={i} className="bar-wrap">
                  <div className="bar" style={{ height: `${val}%` }} />
                </div>
              ))}
            </div>
            <div className="chart-labels">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
          </div>
        </div>

        <div className="home-dashboard-panel">
          <h2>Audience Segments</h2>
          <ul className="home-dashboard-list">
            <li><strong>Top Location:</strong> <span>New York, US</span></li>
            <li><strong>Most Active Hour:</strong> <span>8–9PM</span></li>
            <li><strong>Loyal Followers:</strong> <span>2,315</span></li>
            <li><strong>Interaction Source:</strong> <span>Shares</span></li>
          </ul>
        </div>
      </section>

      <section className="home-dashboard-split">
        <div className="home-dashboard-panel">
          <h2>Most Engaging Posts</h2>
          <ul className="home-dashboard-list">
            <li>💬 <strong>Post #872</strong> – 246 interactions</li>
            <li>🔥 <strong>Post #859</strong> – 2.4k reach</li>
            <li>📈 <strong>Post #830</strong> – +19% shares</li>
          </ul>
        </div>

        <div className="home-dashboard-panel">
          <h2>Posts Needing Review</h2>
          <ul className="home-dashboard-list">
            <li>🚩 <strong>Post #804</strong> – flagged 3x</li>
            <li>⚠️ <strong>Post #781</strong> – comment reported</li>
            <li>🛑 <strong>Post #773</strong> – under moderation</li>
          </ul>
        </div>
      </section>

      <section className="home-dashboard-panel home-dashboard-actions">
        <h2>Quick Tools</h2>
        <div className="home-dashboard-action-grid">
          <button>Create Post</button>
          <button>Schedule Draft</button>
          <button>Boost Content</button>
          <button>Pin Highlight</button>
          <button>Engage Comments</button>
          <button>Export Insights</button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
