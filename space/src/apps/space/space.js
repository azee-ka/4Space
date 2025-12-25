import React, { useState } from 'react';
import './space.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCode, FaCalculator, FaChartLine, FaBookReader, FaPalette,
  FaGamepad, FaGraduationCap, FaRobot, FaMicroscope, FaFlask,
  FaBriefcase, FaUsers, FaShare, FaCog, FaPlus, FaTimes,
  FaEdit, FaTrash, FaExpand, FaLink, FaLock, FaGlobe,
  FaFolder, FaFileAlt, FaImage, FaVideo, FaMusic, FaComments,
  FaTasks, FaCalendar, FaBell, FaChartBar, FaCloud, FaLightbulb,
  FaPencilAlt, FaNewspaper, FaMoneyBill, FaBitcoin, FaHeartbeat
} from 'react-icons/fa';

const Space = () => {
  const [spaces, setSpaces] = useState([
    { 
      id: 'personal', 
      name: 'Personal Hub', 
      accentColor: '#00f0ff',
      definition: 'Your personal everything space - life, work, creativity',
      type: 'personal',
      collaborators: [],
      widgets: []
    },
    { 
      id: 'work', 
      name: 'Engineering', 
      accentColor: '#ff006e',
      definition: 'Development workspace with tools and repositories',
      type: 'work',
      collaborators: [],
      widgets: []
    },
    { 
      id: 'collab', 
      name: 'Shared Space', 
      accentColor: '#8b5cf6',
      definition: 'Collaborative space with friends/team',
      type: 'collaborative',
      collaborators: ['user1@example.com', 'user2@example.com'],
      widgets: []
    }
  ]);

  const [activeSpace, setActiveSpace] = useState(spaces[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const accentColors = [
    '#00f0ff', '#ff006e', '#8b5cf6', '#10b981', '#f59e0b', 
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f97316'
  ];

  // Widget Categories and Templates
  const widgetCategories = [
    { id: 'all', name: 'All Widgets', icon: FaFolder },
    { id: 'engineering', name: 'Engineering', icon: FaCode },
    { id: 'finance', name: 'Finance & Trading', icon: FaMoneyBill },
    { id: 'creative', name: 'Creative', icon: FaPalette },
    { id: 'education', name: 'Education', icon: FaGraduationCap },
    { id: 'productivity', name: 'Productivity', icon: FaTasks },
    { id: 'collaboration', name: 'Collaboration', icon: FaUsers },
    { id: 'analytics', name: 'Analytics', icon: FaChartBar },
    { id: 'health', name: 'Health & Wellness', icon: FaHeartbeat }
  ];

  const widgetLibrary = [
    // Engineering Tools
    { 
      id: 'code-editor', 
      name: 'Code Editor', 
      icon: FaCode, 
      category: 'engineering',
      description: 'Full-featured IDE with syntax highlighting',
      customizable: ['theme', 'language', 'layout'],
      size: 'large'
    },
    { 
      id: 'terminal', 
      name: 'Terminal', 
      icon: FaCode, 
      category: 'engineering',
      description: 'Embedded terminal for command execution',
      customizable: ['shell', 'theme'],
      size: 'medium'
    },
    { 
      id: 'github-activity', 
      name: 'GitHub Activity', 
      icon: FaCode, 
      category: 'engineering',
      description: 'Monitor repository activity and commits',
      customizable: ['repos', 'refresh-rate'],
      size: 'medium'
    },
    { 
      id: 'latex-editor', 
      name: 'LaTeX Editor', 
      icon: FaFlask, 
      category: 'engineering',
      description: 'Write mathematical and scientific documents',
      customizable: ['template', 'packages'],
      size: 'large'
    },
    { 
      id: 'circuit-designer', 
      name: 'Circuit Designer', 
      icon: FaMicroscope, 
      category: 'engineering',
      description: 'Design and simulate electronic circuits',
      customizable: ['components', 'simulation-speed'],
      size: 'large'
    },
    
    // Finance & Trading
    { 
      id: 'portfolio-tracker', 
      name: 'Portfolio Tracker', 
      icon: FaChartLine, 
      category: 'finance',
      description: 'Track stocks, crypto, and investments',
      customizable: ['assets', 'timeframe', 'chart-type'],
      size: 'large'
    },
    { 
      id: 'trading-terminal', 
      name: 'Trading Terminal', 
      icon: FaBitcoin, 
      category: 'finance',
      description: 'Execute trades and analyze markets',
      customizable: ['exchange', 'pairs', 'indicators'],
      size: 'large'
    },
    { 
      id: 'budget-planner', 
      name: 'Budget Planner', 
      icon: FaMoneyBill, 
      category: 'finance',
      description: 'Personal budgeting and expense tracking',
      customizable: ['categories', 'period'],
      size: 'medium'
    },
    { 
      id: 'crypto-ticker', 
      name: 'Crypto Ticker', 
      icon: FaBitcoin, 
      category: 'finance',
      description: 'Real-time cryptocurrency prices',
      customizable: ['currencies', 'update-frequency'],
      size: 'small'
    },
    
    // Creative Tools
    { 
      id: 'canvas', 
      name: 'Drawing Canvas', 
      icon: FaPalette, 
      category: 'creative',
      description: 'Digital canvas for sketching and design',
      customizable: ['brushes', 'canvas-size'],
      size: 'large'
    },
    { 
      id: 'gallery', 
      name: 'Photo Gallery', 
      icon: FaImage, 
      category: 'creative',
      description: 'Organize and share photos',
      customizable: ['layout', 'filters'],
      size: 'medium'
    },
    { 
      id: 'video-library', 
      name: 'Video Library', 
      icon: FaVideo, 
      category: 'creative',
      description: 'Curate and share video content',
      customizable: ['sources', 'playlist'],
      size: 'large'
    },
    { 
      id: 'music-player', 
      name: 'Music Player', 
      icon: FaMusic, 
      category: 'creative',
      description: 'Organize and play music',
      customizable: ['playlists', 'visualizer'],
      size: 'medium'
    },
    
    // Education
    { 
      id: 'note-taking', 
      name: 'Smart Notes', 
      icon: FaPencilAlt, 
      category: 'education',
      description: 'AI-enhanced note-taking with linking',
      customizable: ['format', 'tags', 'templates'],
      size: 'large'
    },
    { 
      id: 'flashcards', 
      name: 'Flashcards', 
      icon: FaGraduationCap, 
      category: 'education',
      description: 'Spaced repetition learning system',
      customizable: ['deck', 'algorithm'],
      size: 'medium'
    },
    { 
      id: 'research-papers', 
      name: 'Research Library', 
      icon: FaBookReader, 
      category: 'education',
      description: 'Organize and annotate research papers',
      customizable: ['tags', 'citations'],
      size: 'large'
    },
    { 
      id: 'calculator', 
      name: 'Scientific Calculator', 
      icon: FaCalculator, 
      category: 'education',
      description: 'Advanced mathematical calculations',
      customizable: ['mode', 'precision'],
      size: 'small'
    },
    
    // Productivity
    { 
      id: 'tasks', 
      name: 'Task Manager', 
      icon: FaTasks, 
      category: 'productivity',
      description: 'Organize tasks and projects',
      customizable: ['view', 'priority', 'tags'],
      size: 'medium'
    },
    { 
      id: 'calendar', 
      name: 'Calendar', 
      icon: FaCalendar, 
      category: 'productivity',
      description: 'Schedule and manage events',
      customizable: ['view', 'integrations'],
      size: 'medium'
    },
    { 
      id: 'quick-links', 
      name: 'Quick Links', 
      icon: FaLink, 
      category: 'productivity',
      description: 'Bookmarks and frequent links',
      customizable: ['categories', 'icons'],
      size: 'small'
    },
    { 
      id: 'journal', 
      name: 'Daily Journal', 
      icon: FaFileAlt, 
      category: 'productivity',
      description: 'Daily reflections and logging',
      customizable: ['prompts', 'privacy'],
      size: 'medium'
    },
    
    // Collaboration
    { 
      id: 'chat', 
      name: 'Team Chat', 
      icon: FaComments, 
      category: 'collaboration',
      description: 'Real-time messaging',
      customizable: ['channels', 'notifications'],
      size: 'large'
    },
    { 
      id: 'shared-links', 
      name: 'Shared Links', 
      icon: FaShare, 
      category: 'collaboration',
      description: 'Collaborative link sharing',
      customizable: ['permissions', 'categories'],
      size: 'medium'
    },
    { 
      id: 'whiteboard', 
      name: 'Whiteboard', 
      icon: FaPalette, 
      category: 'collaboration',
      description: 'Collaborative drawing board',
      customizable: ['tools', 'permissions'],
      size: 'large'
    },
    
    // Analytics
    { 
      id: 'activity-tracker', 
      name: 'Activity Tracker', 
      icon: FaChartBar, 
      category: 'analytics',
      description: 'Track your productivity and habits',
      customizable: ['metrics', 'timeframe'],
      size: 'medium'
    },
    { 
      id: 'analytics-dashboard', 
      name: 'Analytics Dashboard', 
      icon: FaChartLine, 
      category: 'analytics',
      description: 'Visualize data and metrics',
      customizable: ['data-sources', 'charts'],
      size: 'large'
    },
    
    // Health
    { 
      id: 'fitness-tracker', 
      name: 'Fitness Tracker', 
      icon: FaHeartbeat, 
      category: 'health',
      description: 'Track workouts and health metrics',
      customizable: ['goals', 'metrics'],
      size: 'medium'
    },
    { 
      id: 'meditation', 
      name: 'Meditation Timer', 
      icon: FaHeartbeat, 
      category: 'health',
      description: 'Guided meditation and mindfulness',
      customizable: ['duration', 'sounds'],
      size: 'small'
    }
  ];

  const createNewSpace = () => {
    if (newSpaceName.trim()) {
      const newSpace = {
        id: `space-${Date.now()}`,
        name: newSpaceName,
        accentColor: accentColors[Math.floor(Math.random() * accentColors.length)],
        definition: 'Define your space purpose...',
        type: 'personal',
        collaborators: [],
        widgets: []
      };
      setSpaces([...spaces, newSpace]);
      setActiveSpace(newSpace);
      setNewSpaceName('');
      setIsCreating(false);
    }
  };

  const addWidget = (widget) => {
    const updated = { ...activeSpace };
    const newWidget = {
      ...widget,
      instanceId: `${widget.id}-${Date.now()}`,
      config: {},
      position: { x: 0, y: 0 },
      size: widget.size
    };
    updated.widgets = [...updated.widgets, newWidget];
    setActiveSpace(updated);
    setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
    setShowWidgetLibrary(false);
  };

  const removeWidget = (instanceId) => {
    const updated = { ...activeSpace };
    updated.widgets = updated.widgets.filter(w => w.instanceId !== instanceId);
    setActiveSpace(updated);
    setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
  };

  const filteredWidgets = selectedCategory === 'all' 
    ? widgetLibrary 
    : widgetLibrary.filter(w => w.category === selectedCategory);

  return (
    <div className="space-wrapper">
      {/* Background effects
      <div className="bg-grid"></div>
      <div className="bg-glow" style={{ 
        background: `radial-gradient(circle at 20% 30%, ${activeSpace.accentColor}15 0%, transparent 50%)` 
      }}></div>
      <div className="bg-glow-2" style={{ 
        background: `radial-gradient(circle at 80% 70%, ${activeSpace.accentColor}10 0%, transparent 50%)` 
      }}></div> */}

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
              {space.collaborators.length > 0 && (
                <FaUsers style={{ fontSize: '10px', opacity: 0.6 }} />
              )}
              {space.widgets.length > 0 && (
                <span className="tab-count">{space.widgets.length}</span>
              )}
            </motion.button>
          ))}

          <motion.button
            className="nav-tab new"
            onClick={() => setIsCreating(true)}
            whileHover={{ y: -1 }}
          >
            <FaPlus style={{ fontSize: '10px' }} />
            <span className="tab-label">New</span>
          </motion.button>
        </div>

        <div className="nav-actions">
          <button 
            className={`nav-icon-btn ${showConfig ? 'active' : ''}`}
            onClick={() => setShowConfig(!showConfig)}
            title="Configure Space"
          >
            <FaCog />
          </button>
          <button className="nav-icon-btn" title="Share Space">
            <FaShare />
          </button>
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
                  {activeSpace.collaborators.length > 0 && (
                    <div className="space-collaborators">
                      <FaUsers style={{ fontSize: '12px' }} />
                      <span>{activeSpace.collaborators.length} collaborators</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="header-actions">
                <button className="header-action" onClick={() => setShowWidgetLibrary(true)}>
                  <FaPlus /> Add Widget
                </button>
                <button className="header-action" onClick={() => setShowConfig(true)}>
                  <FaCog /> Configure
                </button>
              </div>
            </div>

            {/* Widgets Section */}
            <section className="content-section">
              <div className="section-head">
                <h2 className="section-title">
                  <span className="title-accent" style={{ color: activeSpace.accentColor }}>∎</span>
                  Active Widgets
                </h2>
              </div>

              <div className="widgets-container">
                {activeSpace.widgets.map((widget, index) => (
                  <motion.div
                    key={widget.instanceId}
                    className={`widget-card size-${widget.size}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="widget-edge" style={{ background: activeSpace.accentColor }}></div>
                    <div className="widget-header">
                      <span className="widget-icon">
                        {React.createElement(widget.icon)}
                      </span>
                      <span className="widget-title">{widget.name}</span>
                      <div className="widget-actions">
                        <button className="widget-action-btn" title="Expand">
                          <FaExpand />
                        </button>
                        <button className="widget-action-btn" title="Configure">
                          <FaCog />
                        </button>
                        <button 
                          className="widget-action-btn" 
                          title="Remove"
                          onClick={() => removeWidget(widget.instanceId)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="widget-body">
                      <div className="widget-placeholder">
                        {widget.description}
                      </div>
                    </div>
                    <div className="widget-glow" style={{ 
                      background: `radial-gradient(circle at 50% 100%, ${activeSpace.accentColor}15 0%, transparent 70%)` 
                    }}></div>
                  </motion.div>
                ))}

                {activeSpace.widgets.length === 0 && (
                  <div className="empty-message">
                    <div className="empty-icon"><FaLightbulb /></div>
                    <p>No widgets configured yet</p>
                    <button className="empty-btn" onClick={() => setShowWidgetLibrary(true)}>
                      <FaPlus /> Add your first widget
                    </button>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Widget Library Modal */}
      <AnimatePresence>
        {showWidgetLibrary && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWidgetLibrary(false)}
          >
            <motion.div
              className="widget-library-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Widget Library</h2>
                <button className="close-btn" onClick={() => setShowWidgetLibrary(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="widget-categories">
                {widgetCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={selectedCategory === cat.id ? {
                      borderColor: activeSpace.accentColor,
                      background: `${activeSpace.accentColor}20`
                    } : {}}
                  >
                    {React.createElement(cat.icon, { style: { marginRight: '8px' } })}
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="widget-grid">
                {filteredWidgets.map(widget => (
                  <div
                    key={widget.id}
                    className="widget-library-item"
                    onClick={() => addWidget(widget)}
                  >
                    <div className="widget-lib-icon">
                      {React.createElement(widget.icon)}
                    </div>
                    <h4>{widget.name}</h4>
                    <p>{widget.description}</p>
                    <div className="widget-lib-footer">
                      <span className="widget-size-badge">{widget.size}</span>
                      <button className="add-widget-btn">
                        <FaPlus /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <button className="panel-close" onClick={() => setShowConfig(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="panel-content">
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
                  <label className="config-label">Space Type</label>
                  <select 
                    className="config-input"
                    value={activeSpace.type}
                    onChange={(e) => {
                      const updated = { ...activeSpace, type: e.target.value };
                      setActiveSpace(updated);
                      setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
                    }}
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="collaborative">Collaborative</option>
                    <option value="educational">Educational</option>
                  </select>
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

                <div className="config-group">
                  <label className="config-label">
                    <FaUsers style={{ marginRight: '8px' }} />
                    Collaborators
                  </label>
                  <div className="collaborators-list">
                    {activeSpace.collaborators.map((collab, idx) => (
                      <div key={idx} className="collaborator-item">
                        <span>{collab}</span>
                        <button className="remove-collab-btn">
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                    <button className="add-collab-btn">
                      <FaPlus /> Add Collaborator
                    </button>
                  </div>
                </div>

                <div className="config-group">
                  <label className="config-label">
                    <FaLock style={{ marginRight: '8px' }} />
                    Privacy
                  </label>
                  <div className="privacy-options">
                    <button className="privacy-btn">
                      <FaLock /> Private
                    </button>
                    <button className="privacy-btn">
                      <FaUsers /> Team
                    </button>
                    <button className="privacy-btn">
                      <FaGlobe /> Public
                    </button>
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

export default Space;