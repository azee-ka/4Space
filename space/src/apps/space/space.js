import React, { useState } from 'react';
import './space.css';
import { motion, AnimatePresence } from 'framer-motion';

const Space = () => {
  const [spaces, setSpaces] = useState([
    { 
      id: 'main', 
      name: 'Main Workspace', 
      accentColor: '#00f0ff',
      definition: 'Your primary creative and productivity hub',
      features: ['Rich Editor', 'Code Space', 'File Manager', 'Notes'],
      widgets: ['calendar', 'tasks', 'quick-links']
    },
    { 
      id: 'social', 
      name: 'Social Hub', 
      accentColor: '#ff006e',
      definition: 'Connect across all your social platforms',
      features: ['Twitter Feed', 'Instagram', 'Communities', 'Messages'],
      widgets: ['notifications', 'trending', 'connections']
    },
    { 
      id: 'creative', 
      name: 'Creative Studio', 
      accentColor: '#8b5cf6',
      definition: 'Design, create, and collaborate on visual projects',
      features: ['Canvas', 'Gallery', 'Templates', 'Assets Library'],
      widgets: ['recent-projects', 'inspiration', 'color-palette']
    }
  ]);

  const [activeSpace, setActiveSpace] = useState(spaces[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  const accentColors = [
    '#00f0ff', '#ff006e', '#8b5cf6', '#10b981', '#f59e0b', 
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f97316'
  ];

  const availableFeatures = [
    'Rich Editor', 'Code Space', 'File Manager', 'Notes', 'Calendar',
    'Twitter Feed', 'Instagram', 'Communities', 'Messages', 'Canvas',
    'Gallery', 'Templates', 'Assets Library', 'Analytics', 'Dashboard',
    'Video Calls', 'Screen Share', 'Whiteboard', 'Tasks', 'Goals'
  ];

  const availableWidgets = [
    'calendar', 'tasks', 'quick-links', 'notifications', 'trending',
    'connections', 'recent-projects', 'inspiration', 'color-palette',
    'analytics', 'weather', 'news', 'music', 'timer', 'notes'
  ];

  const createNewSpace = () => {
    if (newSpaceName.trim()) {
      const newSpace = {
        id: `space-${Date.now()}`,
        name: newSpaceName,
        accentColor: accentColors[Math.floor(Math.random() * accentColors.length)],
        definition: 'Define your space purpose...',
        features: [],
        widgets: []
      };
      setSpaces([...spaces, newSpace]);
      setActiveSpace(newSpace);
      setNewSpaceName('');
      setIsCreating(false);
    }
  };

  const updateSpaceFeatures = (feature) => {
    const updated = { ...activeSpace };
    if (updated.features.includes(feature)) {
      updated.features = updated.features.filter(f => f !== feature);
    } else {
      updated.features = [...updated.features, feature];
    }
    setActiveSpace(updated);
    setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
  };

  const updateSpaceWidgets = (widget) => {
    const updated = { ...activeSpace };
    if (updated.widgets.includes(widget)) {
      updated.widgets = updated.widgets.filter(w => w !== widget);
    } else {
      updated.widgets = [...updated.widgets, widget];
    }
    setActiveSpace(updated);
    setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
  };

  return (
    <div className="space-wrapper">
      {/* Background grid effect */}
      <div className="bg-grid"></div>
      <div className="bg-glow" style={{ 
        background: `radial-gradient(circle at 20% 30%, ${activeSpace.accentColor}15 0%, transparent 50%)` 
      }}></div>
      <div className="bg-glow-2" style={{ 
        background: `radial-gradient(circle at 80% 70%, ${activeSpace.accentColor}10 0%, transparent 50%)` 
      }}></div>

      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="brand-mark"></div>
          <span className="brand-text">SPACES</span>
        </div>

        <div className="nav-tabs">
          {spaces.map((space) => (
            <motion.button
              key={space.id}
              className={`nav-tab ${activeSpace.id === space.id ? 'active' : ''}`}
              onClick={() => setActiveSpace(space)}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
            >
              <span className="tab-glow" style={{ background: space.accentColor }}></span>
              <span className="tab-label">{space.name}</span>
              {space.features.length > 0 && (
                <span className="tab-count">{space.features.length}</span>
              )}
            </motion.button>
          ))}

          <motion.button
            className="nav-tab new"
            onClick={() => setIsCreating(true)}
            whileHover={{ y: -1 }}
          >
            <span className="tab-label">+ New</span>
          </motion.button>
        </div>

        <div className="nav-actions">
          <button 
            className={`nav-icon-btn ${showConfig ? 'active' : ''}`}
            onClick={() => setShowConfig(!showConfig)}
          >
            ⚙
          </button>
          <button className="nav-icon-btn">↗</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="space-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSpace.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Space Header */}
            <div className="space-header">
              <div className="header-content">
                <div className="space-indicator" style={{ 
                  boxShadow: `0 0 20px ${activeSpace.accentColor}60, inset 0 0 10px ${activeSpace.accentColor}40` 
                }}>
                  <div className="indicator-inner" style={{ background: activeSpace.accentColor }}></div>
                </div>
                <div>
                  <h1 className="space-name">{activeSpace.name}</h1>
                  <p className="space-desc">{activeSpace.definition}</p>
                </div>
              </div>
              <button className="header-action" onClick={() => setShowConfig(true)}>
                Configure Space
              </button>
            </div>

            {/* Widgets Section */}
            <section className="content-section">
              <div className="section-head">
                <h2 className="section-title">
                  <span className="title-accent" style={{ color: activeSpace.accentColor }}>∎</span>
                  Active Widgets
                </h2>
                <button className="action-link" onClick={() => setShowConfig(true)}>
                  Add Widget →
                </button>
              </div>

              <div className="widgets-container">
                {activeSpace.widgets.map((widget, index) => (
                  <motion.div
                    key={widget}
                    className="widget-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="widget-edge" style={{ background: activeSpace.accentColor }}></div>
                    <div className="widget-header">
                      <span className="widget-icon">{getWidgetIcon(widget)}</span>
                      <span className="widget-title">{formatWidgetName(widget)}</span>
                    </div>
                    <div className="widget-body">
                      <div className="widget-placeholder">
                        {formatWidgetName(widget)} content
                      </div>
                    </div>
                    <div className="widget-glow" style={{ 
                      background: `radial-gradient(circle at 50% 100%, ${activeSpace.accentColor}15 0%, transparent 70%)` 
                    }}></div>
                  </motion.div>
                ))}

                {activeSpace.widgets.length === 0 && (
                  <div className="empty-message">
                    <div className="empty-icon">∅</div>
                    <p>No widgets configured</p>
                    <button className="empty-btn" onClick={() => setShowConfig(true)}>
                      Add your first widget
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Features Section */}
            <section className="content-section">
              <div className="section-head">
                <h2 className="section-title">
                  <span className="title-accent" style={{ color: activeSpace.accentColor }}>∎</span>
                  Enabled Features
                </h2>
                <span className="feature-badge">{activeSpace.features.length} active</span>
              </div>

              <div className="features-grid">
                {activeSpace.features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    className="feature-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div className="feature-dot" style={{ background: activeSpace.accentColor }}></div>
                    <span className="feature-label">{feature}</span>
                    <button className="feature-launch">Launch</button>
                  </motion.div>
                ))}

                {activeSpace.features.length === 0 && (
                  <div className="empty-message">
                    <p>Enable features to unlock functionality</p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Config Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfig(false)}
          >
            <motion.aside
              className="config-panel"
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="panel-header">
                <h2 className="panel-title">Configure Space</h2>
                <button className="panel-close" onClick={() => setShowConfig(false)}>✕</button>
              </div>

              <div className="panel-content">
                {/* Space Details */}
                <div className="config-group">
                  <label className="config-label">Space Name</label>
                  <input
                    type="text"
                    className="config-input"
                    value={activeSpace.name}
                    onChange={(e) => {
                      const updated = { ...activeSpace, name: e.target.value };
                      setActiveSpace(updated);
                      setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
                    }}
                  />
                </div>

                <div className="config-group">
                  <label className="config-label">Definition</label>
                  <textarea
                    className="config-textarea"
                    value={activeSpace.definition}
                    onChange={(e) => {
                      const updated = { ...activeSpace, definition: e.target.value };
                      setActiveSpace(updated);
                      setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
                    }}
                    rows={3}
                  />
                </div>

                <div className="config-group">
                  <label className="config-label">Accent Color</label>
                  <div className="color-grid">
                    {accentColors.map((color) => (
                      <button
                        key={color}
                        className={`color-option ${activeSpace.accentColor === color ? 'selected' : ''}`}
                        style={{ background: color }}
                        onClick={() => {
                          const updated = { ...activeSpace, accentColor: color };
                          setActiveSpace(updated);
                          setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
                        }}
                      >
                        {activeSpace.accentColor === color && <span className="color-check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="config-divider"></div>

                {/* Features */}
                <div className="config-group">
                  <label className="config-label">Features ({activeSpace.features.length})</label>
                  <div className="chip-grid">
                    {availableFeatures.map(feature => (
                      <button
                        key={feature}
                        className={`chip ${activeSpace.features.includes(feature) ? 'active' : ''}`}
                        onClick={() => updateSpaceFeatures(feature)}
                        style={activeSpace.features.includes(feature) ? {
                          borderColor: activeSpace.accentColor,
                          background: `${activeSpace.accentColor}20`
                        } : {}}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="config-divider"></div>

                {/* Widgets */}
                <div className="config-group">
                  <label className="config-label">Widgets ({activeSpace.widgets.length})</label>
                  <div className="chip-grid">
                    {availableWidgets.map(widget => (
                      <button
                        key={widget}
                        className={`chip ${activeSpace.widgets.includes(widget) ? 'active' : ''}`}
                        onClick={() => updateSpaceWidgets(widget)}
                        style={activeSpace.widgets.includes(widget) ? {
                          borderColor: activeSpace.accentColor,
                          background: `${activeSpace.accentColor}20`
                        } : {}}
                      >
                        {getWidgetIcon(widget)} {formatWidgetName(widget)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Space Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="modal-title">Create New Space</h3>
              <p className="modal-subtitle">Give your space a unique name</p>
              
              <input
                type="text"
                className="modal-input"
                placeholder="e.g., Gaming Hub, Study Zone, Art Studio..."
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createNewSpace()}
                autoFocus
              />

              <div className="modal-actions">
                <button className="modal-btn cancel" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button className="modal-btn create" onClick={createNewSpace}>
                  Create Space
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper functions
const getWidgetIcon = (widget) => {
  const icons = {
    calendar: '📅',
    tasks: '✓',
    'quick-links': '🔗',
    notifications: '🔔',
    trending: '📈',
    connections: '👥',
    'recent-projects': '📂',
    inspiration: '💡',
    'color-palette': '🎨',
    analytics: '📊',
    weather: '🌤',
    news: '📰',
    music: '🎵',
    timer: '⏱',
    notes: '📝'
  };
  return icons[widget] || '◈';
};

const formatWidgetName = (widget) => {
  return widget.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default Space;