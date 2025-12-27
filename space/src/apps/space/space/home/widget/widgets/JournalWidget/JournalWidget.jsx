import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import './JournalWidget.css';
import { 
  FaSearch, FaFilter, FaCalendarAlt, FaChartLine,
  FaExternalLinkAlt, FaClock, FaChartBar, FaFire
} from 'react-icons/fa';

// Mock API functions (replace with real API calls)
const fetchJournalEntries = async (widgetId) => {
  // TODO: Replace with actual API call
  return [];
};

const fetchJournalStats = async (widgetId) => {
  // TODO: Replace with actual API call
  return {
    current_streak: 0,
    total_entries: 0,
    entries_this_month: 0,
    entries_this_week: 0,
    avg_entries_per_week: 0,
    most_common_mood: null
  };
};

// ============================================
// MOOD CONFIGURATION
// ============================================

const MOODS = [
  { id: 'amazing', label: 'Amazing', color: '#10b981' },
  { id: 'good', label: 'Good', color: '#3b82f6' },
  { id: 'okay', label: 'Okay', color: '#f59e0b' },
  { id: 'bad', label: 'Bad', color: '#ef4444' },
  { id: 'terrible', label: 'Terrible', color: '#991b1b' }
];

// ============================================
// COMPACT MODE (In Widget Card)
// ============================================

const JournalCompact = ({ widget }) => {
  const { data: entries = [] } = useQuery({
    queryKey: ['journal-entries', widget.id],
    queryFn: () => fetchJournalEntries(widget.id)
  });

  const { data: stats } = useQuery({
    queryKey: ['journal-stats', widget.id],
    queryFn: () => fetchJournalStats(widget.id)
  });

  const recentEntries = entries.slice(0, 3);

  if (entries.length === 0) {
    return (
      <div className="journal-compact-empty">
        <div className="compact-empty-state">
          <div className="empty-icon-wrapper">
            <FaCalendarAlt />
          </div>
          <p>No journal entries yet</p>
          <span>Click to start journaling</span>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-compact">
      {/* Quick Stats */}
      <div className="compact-stats-grid">
        <div className="compact-stat-card">
          <div className="stat-icon-wrapper streak">
            <FaFire />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.current_streak || 0}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>
        <div className="compact-stat-card">
          <div className="stat-icon-wrapper">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.entries_this_month || 0}</div>
            <div className="stat-label">This Month</div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="compact-entries-list">
        {recentEntries.map(entry => {
          const mood = MOODS.find(m => m.id === entry.mood);
          return (
            <div key={entry.id} className="compact-entry-item">
              <div className="entry-item-header">
                {mood && (
                  <span 
                    className="mood-indicator" 
                    style={{ background: `${mood.color}40`, borderColor: mood.color }}
                  />
                )}
                <span className="entry-date-compact">
                  {new Date(entry.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <p className="entry-title-compact">{entry.title || 'Untitled Entry'}</p>
            </div>
          );
        })}
      </div>
      
      <div className="compact-view-all">
        <span>Click to view dashboard</span>
      </div>
    </div>
  );
};

// ============================================
// MODAL MODE (Dashboard/Overview)
// ============================================

const JournalModal = ({ widget, onConfigUpdate, spaceId }) => {
  const [activeTab, setActiveTab] = useState('recent'); // recent, insights, calendar
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries', widget.id],
    queryFn: () => fetchJournalEntries(widget.id)
  });

  const { data: stats } = useQuery({
    queryKey: ['journal-stats', widget.id],
    queryFn: () => fetchJournalStats(widget.id)
  });

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = !moodFilter || entry.mood === moodFilter;
    return matchesSearch && matchesMood;
  });

  const handleOpenJournalApp = () => {
    // Open journal in new window/tab with proper path
    window.open(`/space/${spaceId}/journal/${widget.id}`, '_blank');
  };

  return (
    <div className="journal-modal-content">
      {/* Left Sidebar - Stats & Actions */}
      <div className="journal-sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <h3>Journal Stats</h3>
        </div>

        {/* Stats Cards - Vertical Stack */}
        <div className="sidebar-stats">
          <div className="sidebar-stat-card streak-card">
            <div className="sidebar-stat-icon">
              <FaFire />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{stats?.current_streak || 0}</div>
              <div className="sidebar-stat-label">Day Streak</div>
            </div>
          </div>
          
          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{stats?.entries_this_month || 0}</div>
              <div className="sidebar-stat-label">This Month</div>
            </div>
          </div>
          
          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon">
              <FaClock />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{stats?.entries_this_week || 0}</div>
              <div className="sidebar-stat-label">This Week</div>
            </div>
          </div>
          
          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon">
              <FaChartBar />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{stats?.total_entries || 0}</div>
              <div className="sidebar-stat-label">Total</div>
            </div>
          </div>
        </div>

        {/* Mood Filter */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Filter by Mood</div>
          <div className="sidebar-mood-filters">
            <button
              className={`sidebar-mood-pill ${!moodFilter ? 'active' : ''}`}
              onClick={() => setMoodFilter(null)}
            >
              All
            </button>
            {MOODS.map(mood => (
              <button
                key={mood.id}
                className={`sidebar-mood-pill ${moodFilter === mood.id ? 'active' : ''}`}
                onClick={() => setMoodFilter(mood.id)}
                style={moodFilter === mood.id ? { 
                  borderColor: mood.color,
                  background: `${mood.color}20`
                } : {}}
              >
                <span 
                  className="sidebar-mood-indicator" 
                  style={{ background: mood.color }}
                />
                {mood.label}
              </button>
            ))}
          </div>
        </div>

        {/* Open App Button */}
        <button className="sidebar-open-app-btn" onClick={handleOpenJournalApp}>
          <FaExternalLinkAlt />
          Open Full Journal
        </button>
      </div>

      {/* Right Main Content - Tabs & Entries */}
      <div className="journal-main-content">
        {/* Search Bar */}
        <div className="main-content-header">
          <div className="search-input-wrapper">
            <FaSearch />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="journal-tabs-nav">
          <button
            className={`journal-tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Recent Entries
            <span className="journal-tab-count">{filteredEntries.length}</span>
          </button>
          <button
            className={`journal-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <FaChartLine />
            Insights
          </button>
          <button
            className={`journal-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <FaCalendarAlt />
            Calendar
          </button>
        </div>

        {/* Tab Content */}
        <div className="journal-tab-content">
          {activeTab === 'recent' && (
            <RecentEntriesTab 
              entries={filteredEntries} 
              isLoading={isLoading}
              onOpenApp={handleOpenJournalApp}
            />
          )}
          {activeTab === 'insights' && (
            <InsightsTab stats={stats} entries={entries} />
          )}
          {activeTab === 'calendar' && (
            <CalendarTab entries={entries} />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TAB COMPONENTS
// ============================================

const RecentEntriesTab = ({ entries, isLoading, onOpenApp }) => {
  if (isLoading) {
    return (
      <div className="tab-loading">
        <div className="loading-spinner" />
        <p>Loading entries...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="tab-empty">
        <div className="empty-state-icon">
          <FaCalendarAlt />
        </div>
        <h3>No journal entries yet</h3>
        <p>Start documenting your thoughts and experiences</p>
        <button className="empty-action-btn" onClick={onOpenApp}>
          <FaExternalLinkAlt />
          Open Journal App
        </button>
      </div>
    );
  }

  return (
    <div className="journal-entries-list-view">
      {entries.map(entry => (
        <EntryPreviewCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
};

const InsightsTab = ({ stats, entries }) => {
  // Calculate mood distribution
  const moodDistribution = MOODS.map(mood => ({
    ...mood,
    count: entries.filter(e => e.mood === mood.id).length
  }));

  const totalMoodEntries = moodDistribution.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="insights-view">
      <div className="insights-grid">
        {/* Mood Distribution */}
        <div className="insight-card">
          <div className="insight-card-header">
            <h3>Mood Distribution</h3>
            <span className="insight-badge">Last 30 days</span>
          </div>
          <div className="mood-distribution">
            {moodDistribution.map(mood => {
              const percentage = totalMoodEntries > 0 
                ? Math.round((mood.count / totalMoodEntries) * 100) 
                : 0;
              
              return (
                <div key={mood.id} className="mood-dist-item">
                  <div className="mood-dist-label">
                    <span 
                      className="mood-color-dot" 
                      style={{ background: mood.color }}
                    />
                    <span>{mood.label}</span>
                  </div>
                  <div className="mood-dist-bar-container">
                    <div 
                      className="mood-dist-bar" 
                      style={{ 
                        width: `${percentage}%`,
                        background: mood.color
                      }}
                    />
                  </div>
                  <div className="mood-dist-value">{mood.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Heatmap Preview */}
        <div className="insight-card">
          <div className="insight-card-header">
            <h3>Activity Pattern</h3>
            <span className="insight-badge">Last 12 weeks</span>
          </div>
          <div className="activity-preview">
            <p>Activity heatmap visualization</p>
            <span className="coming-soon-badge">View in full app</span>
          </div>
        </div>

        {/* Writing Stats */}
        <div className="insight-card">
          <div className="insight-card-header">
            <h3>Writing Statistics</h3>
          </div>
          <div className="writing-stats">
            <div className="writing-stat-item">
              <span className="writing-stat-label">Average per week</span>
              <span className="writing-stat-value">{stats?.avg_entries_per_week || 0}</span>
            </div>
            <div className="writing-stat-item">
              <span className="writing-stat-label">Total entries</span>
              <span className="writing-stat-value">{stats?.total_entries || 0}</span>
            </div>
            <div className="writing-stat-item">
              <span className="writing-stat-label">Current streak</span>
              <span className="writing-stat-value">{stats?.current_streak || 0} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarTab = ({ entries }) => {
  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = new Date(entry.date).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <div className="calendar-view">
      <div className="calendar-placeholder">
        <FaCalendarAlt />
        <h3>Calendar View</h3>
        <p>Interactive calendar visualization</p>
        <span className="coming-soon-badge">Available in full Journal App</span>
      </div>
    </div>
  );
};

const EntryPreviewCard = ({ entry }) => {
  const mood = MOODS.find(m => m.id === entry.mood);
  
  return (
    <div className="journal-entry-preview-card">
      <div className="journal-entry-preview-header">
        <div className="journal-entry-preview-meta">
          <span className="journal-entry-preview-date">
            {new Date(entry.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          {mood && (
            <span 
              className="journal-entry-preview-mood"
              style={{ 
                background: `${mood.color}30`,
                borderColor: mood.color,
                color: mood.color
              }}
            >
              {mood.label}
            </span>
          )}
        </div>
      </div>
      
      <h4 className="journal-entry-preview-title">{entry.title || 'Untitled Entry'}</h4>
      
      <p className="journal-entry-preview-excerpt">
        {entry.content?.replace(/<[^>]*>/g, '').substring(0, 150)}
        {entry.content?.length > 150 ? '...' : ''}
      </p>
      
      {entry.tags && entry.tags.length > 0 && (
        <div className="journal-entry-preview-tags">
          {entry.tags.slice(0, 3).map(tag => (
            <span key={tag} className="journal-entry-tag-badge">#{tag}</span>
          ))}
          {entry.tags.length > 3 && (
            <span className="journal-entry-tag-more">+{entry.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN EXPORT
// ============================================

const JournalWidget = ({ widget, mode = 'full', isCompact, onConfigUpdate, spaceId }) => {
  if (mode === 'compact' || isCompact) {
    return <JournalCompact widget={widget} />;
  }
  
  // Modal mode is now the dashboard
  return <JournalModal widget={widget} onConfigUpdate={onConfigUpdate} spaceId={spaceId} />;
};

export default JournalWidget;