import React, { useState, useEffect } from 'react';
import './space.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FaCode, FaCalculator, FaChartLine, FaBookReader, FaPalette,
  FaGamepad, FaGraduationCap, FaRobot, FaMicroscope, FaFlask,
  FaBriefcase, FaUsers, FaShare, FaCog, FaPlus, FaTimes,
  FaEdit, FaTrash, FaExpand, FaLink, FaLock, FaGlobe,
  FaFolder, FaFileAlt, FaImage, FaVideo, FaMusic, FaComments,
  FaTasks, FaCalendar, FaBell, FaChartBar, FaCloud, FaLightbulb,
  FaPencilAlt, FaNewspaper, FaMoneyBill, FaBitcoin, FaHeartbeat,
  FaSpinner, FaRocket, FaPen, FaTerminal, FaDatabase
} from 'react-icons/fa';
import {
  fetchSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  addSpaceWidget,
  removeSpaceWidget,
  inviteCollaborator,
  removeCollaborator as removeCollaboratorAPI
} from '../../services/space';

// ============================================
// CONFIGURATION & REGISTRY
// ============================================

const ACCENT_COLORS = [
  '#00f0ff', '#ff006e', '#8b5cf6', '#10b981', '#f59e0b', 
  '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f97316'
];

const WIDGET_CATEGORIES = [
  { id: 'all', name: 'All Widgets', icon: FaFolder },
  { id: 'engineering', name: 'Engineering', icon: FaCode },
  { id: 'finance', name: 'Finance', icon: FaMoneyBill },
  { id: 'creative', name: 'Creative', icon: FaPalette },
  { id: 'education', name: 'Education', icon: FaGraduationCap },
  { id: 'productivity', name: 'Productivity', icon: FaTasks },
  { id: 'collaboration', name: 'Collaboration', icon: FaUsers },
  { id: 'analytics', name: 'Analytics', icon: FaChartBar },
  { id: 'health', name: 'Health', icon: FaHeartbeat }
];

const WIDGET_REGISTRY = [
  // Engineering
  { id: 'code-editor', name: 'Code Editor', icon: FaCode, category: 'engineering', description: 'Full IDE with syntax highlighting', size: 'large' },
  { id: 'terminal', name: 'Terminal', icon: FaTerminal, category: 'engineering', description: 'Command line interface', size: 'medium' },
  { id: 'github-activity', name: 'GitHub', icon: FaCode, category: 'engineering', description: 'Track repository activity', size: 'medium' },
  { id: 'database', name: 'Database Manager', icon: FaDatabase, category: 'engineering', description: 'Manage databases', size: 'large' },
  
  // Finance
  { id: 'portfolio', name: 'Portfolio', icon: FaChartLine, category: 'finance', description: 'Track investments', size: 'large' },
  { id: 'trading', name: 'Trading Terminal', icon: FaBitcoin, category: 'finance', description: 'Execute trades', size: 'large' },
  { id: 'budget', name: 'Budget', icon: FaMoneyBill, category: 'finance', description: 'Track expenses', size: 'medium' },
  { id: 'crypto-ticker', name: 'Crypto Ticker', icon: FaBitcoin, category: 'finance', description: 'Live crypto prices', size: 'small' },
  
  // Creative
  { id: 'canvas', name: 'Canvas', icon: FaPalette, category: 'creative', description: 'Digital drawing', size: 'large' },
  { id: 'gallery', name: 'Gallery', icon: FaImage, category: 'creative', description: 'Photo collection', size: 'medium' },
  { id: 'video', name: 'Videos', icon: FaVideo, category: 'creative', description: 'Video library', size: 'large' },
  { id: 'music', name: 'Music', icon: FaMusic, category: 'creative', description: 'Music player', size: 'medium' },
  
  // Education
  { id: 'notes', name: 'Notes', icon: FaPencilAlt, category: 'education', description: 'Smart note-taking', size: 'large' },
  { id: 'flashcards', name: 'Flashcards', icon: FaGraduationCap, category: 'education', description: 'Study with flashcards', size: 'medium' },
  { id: 'research', name: 'Research', icon: FaBookReader, category: 'education', description: 'Organize papers', size: 'large' },
  { id: 'calculator', name: 'Calculator', icon: FaCalculator, category: 'education', description: 'Scientific calculator', size: 'small' },
  
  // Productivity
  { id: 'tasks', name: 'Tasks', icon: FaTasks, category: 'productivity', description: 'Task management', size: 'medium' },
  { id: 'calendar', name: 'Calendar', icon: FaCalendar, category: 'productivity', description: 'Schedule events', size: 'medium' },
  { id: 'links', name: 'Quick Links', icon: FaLink, category: 'productivity', description: 'Bookmarks', size: 'small' },
  { id: 'journal', name: 'Journal', icon: FaFileAlt, category: 'productivity', description: 'Daily journal', size: 'medium' },
  
  // Collaboration
  { id: 'chat', name: 'Chat', icon: FaComments, category: 'collaboration', description: 'Team messaging', size: 'large' },
  { id: 'shared-links', name: 'Shared Links', icon: FaShare, category: 'collaboration', description: 'Share resources', size: 'medium' },
  { id: 'whiteboard', name: 'Whiteboard', icon: FaPalette, category: 'collaboration', description: 'Collaborative board', size: 'large' },
  
  // Analytics
  { id: 'activity', name: 'Activity', icon: FaChartBar, category: 'analytics', description: 'Track productivity', size: 'medium' },
  { id: 'analytics', name: 'Analytics', icon: FaChartLine, category: 'analytics', description: 'Data visualization', size: 'large' },
  
  // Health
  { id: 'fitness', name: 'Fitness', icon: FaHeartbeat, category: 'health', description: 'Track workouts', size: 'medium' },
  { id: 'meditation', name: 'Meditation', icon: FaHeartbeat, category: 'health', description: 'Mindfulness timer', size: 'small' }
];

const SPACE_TEMPLATES = [
  {
    id: 'developer',
    name: 'Developer Workspace',
    icon: FaCode,
    description: 'Complete dev environment',
    type: 'work',
    accentColor: '#00f0ff',
    definition: 'Your development command center',
    widgets: ['code-editor', 'terminal', 'github-activity', 'tasks', 'links']
  },
  {
    id: 'trader',
    name: 'Trading Desk',
    icon: FaBitcoin,
    description: 'Professional trading setup',
    type: 'finance',
    accentColor: '#10b981',
    definition: 'Your trading command center',
    widgets: ['trading', 'portfolio', 'crypto-ticker', 'analytics']
  },
  {
    id: 'student',
    name: 'Study Space',
    icon: FaGraduationCap,
    description: 'Optimized for learning',
    type: 'educational',
    accentColor: '#8b5cf6',
    definition: 'Your study sanctuary',
    widgets: ['notes', 'flashcards', 'research', 'tasks', 'calendar']
  },
  {
    id: 'creative',
    name: 'Creative Studio',
    icon: FaPalette,
    description: 'For artists and designers',
    type: 'creative',
    accentColor: '#ec4899',
    definition: 'Creative workspace',
    widgets: ['canvas', 'gallery', 'music']
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    icon: FaPlus,
    description: 'Start from scratch',
    type: 'personal',
    accentColor: '#00f0ff',
    definition: 'Build your own space',
    widgets: []
  }
];

// ============================================
// MAIN COMPONENT
// ============================================

const Space = () => {
  const queryClient = useQueryClient();
  const [activeSpace, setActiveSpace] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [collaboratorEmail, setCollaboratorEmail] = useState('');

  // Fetch spaces from API
  const { data: spaces = [], isLoading, error } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => fetchSpaces({ exclude_archived: 'true' }),
    refetchOnWindowFocus: false
  });

  // Set active space when spaces load
  useEffect(() => {
    if (spaces.length > 0 && !activeSpace) {
      setActiveSpace(spaces[0]);
    }
  }, [spaces]);

  // Update active space when spaces change
  useEffect(() => {
    if (activeSpace && spaces.length > 0) {
      const updated = spaces.find(s => s.id === activeSpace.id);
      if (updated) setActiveSpace(updated);
    }
  }, [spaces]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: async (newSpace) => {
      await queryClient.invalidateQueries(['spaces']);
      setActiveSpace(newSpace);
      setNewSpaceName('');
      setSelectedTemplate(null);
      setIsCreating(false);
      setShowTemplates(false);
      
      // Add template widgets
      if (selectedTemplate) {
        const template = SPACE_TEMPLATES.find(t => t.id === selectedTemplate);
        if (template?.widgets) {
          for (const widgetId of template.widgets) {
            const widget = WIDGET_REGISTRY.find(w => w.id === widgetId);
            if (widget) {
              await addSpaceWidget(newSpace.id, {
                widget_type: widget.id,
                name: widget.name,
                description: widget.description,
                size: widget.size,
                config: {}
              });
            }
          }
          queryClient.invalidateQueries(['spaces']);
        }
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ spaceId, updates }) => updateSpace(spaceId, updates),
    onSuccess: () => queryClient.invalidateQueries(['spaces'])
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSpace,
    onSuccess: () => {
      queryClient.invalidateQueries(['spaces']);
      setActiveSpace(spaces.length > 1 ? spaces.find(s => s.id !== activeSpace?.id) : null);
    }
  });

  const addWidgetMutation = useMutation({
    mutationFn: ({ spaceId, widget }) => addSpaceWidget(spaceId, {
      widget_type: widget.id,
      name: widget.name,
      description: widget.description,
      size: widget.size,
      config: {}
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['spaces']);
      setShowWidgetLibrary(false);
    }
  });

  const removeWidgetMutation = useMutation({
    mutationFn: ({ spaceId, widgetId }) => removeSpaceWidget(spaceId, widgetId),
    onSuccess: () => queryClient.invalidateQueries(['spaces'])
  });

  const inviteMutation = useMutation({
    mutationFn: ({ spaceId, email }) => inviteCollaborator(spaceId, email),
    onSuccess: () => {
      queryClient.invalidateQueries(['spaces']);
      setCollaboratorEmail('');
      alert('Invited!');
    }
  });

  const removeCollabMutation = useMutation({
    mutationFn: ({ spaceId, userId }) => removeCollaboratorAPI(spaceId, userId),
    onSuccess: () => queryClient.invalidateQueries(['spaces'])
  });

  // Handlers
  const handleCreateSpace = () => {
    if (!newSpaceName.trim()) return;
    const template = selectedTemplate ? SPACE_TEMPLATES.find(t => t.id === selectedTemplate) : null;
    
    createMutation.mutate({
      name: newSpaceName,
      definition: template?.definition || 'Define your space...',
      type: template?.type || 'personal',
      privacy: 'private',
      accent_color: template?.accentColor || ACCENT_COLORS[0],
      config: {}
    });
  };

  const filteredWidgets = selectedCategory === 'all' 
    ? WIDGET_REGISTRY 
    : WIDGET_REGISTRY.filter(w => w.category === selectedCategory);

  const getWidgetIcon = (widgetType) => {
    const widget = WIDGET_REGISTRY.find(w => w.id === widgetType);
    return widget?.icon || FaFolder;
  };

  // Default accent color
  const currentAccentColor = activeSpace?.accent_color || ACCENT_COLORS[0];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-wrapper">
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <FaSpinner className="spinner" style={{ fontSize: '48px' }} />
          <p style={{ marginTop: '16px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-wrapper">
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <p style={{ color: '#ff006e', marginBottom: '16px' }}>Failed to load</p>
          <button className="empty-btn" onClick={() => queryClient.invalidateQueries(['spaces'])}>Retry</button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!activeSpace && spaces.length === 0) {
    return (
      <div className="space-wrapper">
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div className="empty-icon"><FaRocket /></div>
          <h2 style={{ marginBottom: '8px' }}>Welcome to Spaces</h2>
          <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.6)' }}>Create your first space</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="empty-btn" onClick={() => setShowTemplates(true)}>
              <FaRocket /> Use Template
            </button>
            <button className="empty-btn" onClick={() => setIsCreating(true)}>
              <FaPlus /> Start from Scratch
            </button>
          </div>
        </div>
        
        {/* Create Modal for Empty State */}
        <AnimatePresence>
          {(isCreating || showTemplates) && (
            <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsCreating(false); setShowTemplates(false); }}>
              <motion.div className="create-space-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
                {showTemplates ? (
                  <>
                    <div className="modal-header">
                      <h2>Choose Template</h2>
                      <button className="close-btn" onClick={() => setShowTemplates(false)}><FaTimes /></button>
                    </div>
                    <div className="templates-grid">
                      {SPACE_TEMPLATES.map(t => {
                        const Icon = t.icon;
                        return (
                          <div key={t.id} className={`template-card ${selectedTemplate === t.id ? 'selected' : ''}`} onClick={() => setSelectedTemplate(t.id)} style={selectedTemplate === t.id ? { borderColor: t.accentColor } : {}}>
                            <div className="template-icon" style={{ color: t.accentColor }}><Icon /></div>
                            <h4>{t.name}</h4>
                            <p>{t.description}</p>
                            <div className="template-badge">{t.widgets.length} widgets</div>
                          </div>
                        );
                      })}
                    </div>
                    {selectedTemplate && (
                      <div className="modal-footer">
                        <input type="text" className="modal-input" placeholder="Space name..." value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateSpace()} autoFocus />
                        <div className="modal-actions">
                          <button className="modal-btn cancel" onClick={() => setShowTemplates(false)}>Cancel</button>
                          <button className="modal-btn create" onClick={handleCreateSpace} disabled={createMutation.isLoading || !newSpaceName.trim()}>
                            {createMutation.isLoading ? 'Creating...' : 'Create'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="modal-title">Create Space</h3>
                    <p className="modal-subtitle">Name your space</p>
                    <input type="text" className="modal-input" placeholder="e.g., Work, Study..." value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateSpace()} autoFocus />
                    <div className="modal-actions">
                      <button className="modal-btn cancel" onClick={() => setIsCreating(false)}>Cancel</button>
                      <button className="modal-btn create" onClick={handleCreateSpace} disabled={createMutation.isLoading || !newSpaceName.trim()}>
                        {createMutation.isLoading ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Main UI (with activeSpace)
  return (
    <div className="space-wrapper">
      {/* Background */}
      <div className="bg-grid"></div>
      <div className="bg-glow" style={{ background: `radial-gradient(circle at 20% 30%, ${currentAccentColor}15 0%, transparent 50%)` }}></div>
      <div className="bg-glow-2" style={{ background: `radial-gradient(circle at 80% 70%, ${currentAccentColor}10 0%, transparent 50%)` }}></div>

      {/* Nav */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="brand-mark"></div>
          <span className="brand-text">SPACES</span>
        </div>
        <div className="nav-tabs">
          {spaces.map(s => (
            <motion.button key={s.id} className={`nav-tab ${activeSpace?.id === s.id ? 'active' : ''}`} onClick={() => setActiveSpace(s)} whileHover={{ y: -1 }}>
              <span className="tab-glow" style={{ background: s.accent_color || ACCENT_COLORS[0] }}></span>
              <span className="tab-label">{s.name}</span>
              {s.collaborators?.length > 0 && <FaUsers style={{ fontSize: '10px', opacity: 0.6 }} />}
              {s.widgets?.length > 0 && <span className="tab-count">{s.widgets.length}</span>}
            </motion.button>
          ))}
          <motion.button className="nav-tab new" onClick={() => setShowTemplates(true)} whileHover={{ y: -1 }}>
            <FaPlus style={{ fontSize: '10px' }} />
            <span className="tab-label">New</span>
          </motion.button>
        </div>
        <div className="nav-actions">
          <button className={`nav-icon-btn ${showConfig ? 'active' : ''}`} onClick={() => setShowConfig(!showConfig)}><FaCog /></button>
          <button className="nav-icon-btn" onClick={() => setShowConfig(true)}><FaShare /></button>
        </div>
      </nav>

      {/* Main Content */}
      {activeSpace && (
        <main className="space-main">
          <AnimatePresence mode="wait">
            <motion.div key={activeSpace.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              
              {/* Header */}
              <div className="space-header">
                <div className="header-content">
                  <div className="space-indicator" style={{ boxShadow: `0 0 20px ${currentAccentColor}60, inset 0 0 10px ${currentAccentColor}40` }}>
                    <div className="indicator-inner" style={{ background: currentAccentColor }}></div>
                  </div>
                  <div>
                    <h1 className="space-name">{activeSpace.name}</h1>
                    <p className="space-desc">{activeSpace.definition}</p>
                    {activeSpace.collaborators?.length > 0 && (
                      <div className="space-collaborators">
                        <FaUsers style={{ fontSize: '12px' }} />
                        <span>{activeSpace.collaborators.length} collaborators</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="header-actions">
                  <button className="header-action" onClick={() => setShowWidgetLibrary(true)}><FaPlus /> Add Widget</button>
                  <button className="header-action" onClick={() => setShowConfig(true)}><FaCog /> Configure</button>
                </div>
              </div>

              {/* Widgets */}
              <section className="content-section">
                <div className="section-head">
                  <h2 className="section-title">
                    <span className="title-accent" style={{ color: currentAccentColor }}>∎</span>
                    Active Widgets
                  </h2>
                </div>
                <div className="widgets-container">
                  {activeSpace.widgets?.length > 0 ? activeSpace.widgets.map((w, i) => {
                    const Icon = getWidgetIcon(w.widget_type);
                    return (
                      <motion.div key={w.id} className={`widget-card size-${w.size}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="widget-edge" style={{ background: currentAccentColor }}></div>
                        <div className="widget-header">
                          <span className="widget-icon"><Icon /></span>
                          <span className="widget-title">{w.name}</span>
                          <div className="widget-actions">
                            <button className="widget-action-btn"><FaExpand /></button>
                            <button className="widget-action-btn"><FaCog /></button>
                            <button className="widget-action-btn" onClick={() => window.confirm('Remove?') && removeWidgetMutation.mutate({ spaceId: activeSpace.id, widgetId: w.id })}><FaTrash /></button>
                          </div>
                        </div>
                        <div className="widget-body">
                          <div className="widget-placeholder">{w.description}</div>
                        </div>
                        <div className="widget-glow" style={{ background: `radial-gradient(circle at 50% 100%, ${currentAccentColor}15 0%, transparent 70%)` }}></div>
                      </motion.div>
                    );
                  }) : (
                    <div className="empty-message">
                      <div className="empty-icon"><FaLightbulb /></div>
                      <p>No widgets yet</p>
                      <button className="empty-btn" onClick={() => setShowWidgetLibrary(true)}><FaPlus /> Add Widget</button>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {/* Widget Library */}
      <AnimatePresence>
        {showWidgetLibrary && activeSpace && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWidgetLibrary(false)}>
            <motion.div className="widget-library-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Widget Library</h2>
                <button className="close-btn" onClick={() => setShowWidgetLibrary(false)}><FaTimes /></button>
              </div>
              <div className="widget-categories">
                {WIDGET_CATEGORIES.map(c => {
                  const Icon = c.icon;
                  return (
                    <button key={c.id} className={`category-btn ${selectedCategory === c.id ? 'active' : ''}`} onClick={() => setSelectedCategory(c.id)} style={selectedCategory === c.id ? { borderColor: currentAccentColor, background: `${currentAccentColor}20` } : {}}>
                      <Icon style={{ marginRight: '8px' }} />{c.name}
                    </button>
                  );
                })}
              </div>
              <div className="widget-grid">
                {filteredWidgets.map(w => {
                  const Icon = w.icon;
                  return (
                    <div key={w.id} className="widget-library-item" onClick={() => addWidgetMutation.mutate({ spaceId: activeSpace.id, widget: w })}>
                      <div className="widget-lib-icon"><Icon /></div>
                      <h4>{w.name}</h4>
                      <p>{w.description}</p>
                      <div className="widget-lib-footer">
                        <span className="widget-size-badge">{w.size}</span>
                        <button className="add-widget-btn"><FaPlus /> Add</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Panel */}
      <AnimatePresence>
        {showConfig && activeSpace && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfig(false)}>
            <motion.aside className="config-panel" initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} onClick={(e) => e.stopPropagation()}>
              <div className="panel-header">
                <h2 className="panel-title">Configure</h2>
                <button className="panel-close" onClick={() => setShowConfig(false)}><FaTimes /></button>
              </div>
              <div className="panel-content">
                <div className="config-group">
                  <label className="config-label">Name</label>
                  <input className="config-input" value={activeSpace.name} onChange={(e) => updateMutation.mutate({ spaceId: activeSpace.id, updates: { name: e.target.value } })} />
                </div>
                <div className="config-group">
                  <label className="config-label">Definition</label>
                  <textarea className="config-textarea" value={activeSpace.definition} onChange={(e) => updateMutation.mutate({ spaceId: activeSpace.id, updates: { definition: e.target.value } })} rows={3} />
                </div>
                <div className="config-group">
                  <label className="config-label">Type</label>
                  <select className="config-input" value={activeSpace.type} onChange={(e) => updateMutation.mutate({ spaceId: activeSpace.id, updates: { type: e.target.value } })}>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="collaborative">Collaborative</option>
                    <option value="educational">Educational</option>
                    <option value="creative">Creative</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
                <div className="config-group">
                  <label className="config-label">Color</label>
                  <div className="color-grid">
                    {ACCENT_COLORS.map(c => (
                      <button key={c} className={`color-option ${activeSpace.accent_color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => updateMutation.mutate({ spaceId: activeSpace.id, updates: { accent_color: c } })}>
                        {activeSpace.accent_color === c && <span className="color-check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="config-divider"></div>
                <div className="config-group">
                  <label className="config-label"><FaUsers style={{ marginRight: '8px' }} />Collaborators</label>
                  <div className="collaborators-list">
                    {activeSpace.collaborators?.map(c => (
                      <div key={c.id} className="collaborator-item">
                        <span>{c.username || c.email}</span>
                        <button className="remove-collab-btn" onClick={() => window.confirm('Remove?') && removeCollabMutation.mutate({ spaceId: activeSpace.id, userId: c.id })}><FaTimes /></button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input className="config-input" placeholder="Email" value={collaboratorEmail} onChange={(e) => setCollaboratorEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && collaboratorEmail.trim() && inviteMutation.mutate({ spaceId: activeSpace.id, email: collaboratorEmail })} />
                      <button className="header-action" onClick={() => collaboratorEmail.trim() && inviteMutation.mutate({ spaceId: activeSpace.id, email: collaboratorEmail })} disabled={inviteMutation.isLoading}>
                        {inviteMutation.isLoading ? <FaSpinner className="spinner" /> : <FaPlus />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="config-group">
                  <label className="config-label"><FaLock style={{ marginRight: '8px' }} />Privacy</label>
                  <div className="privacy-options">
                    <button className={`privacy-btn ${activeSpace.privacy === 'private' ? 'active' : ''}`} onClick={() => updateMutation.mutate({ spaceId: activeSpace.id, updates: { privacy: 'private' } })}><FaLock /> Private</button>
                    <button className={`privacy-btn ${activeSpace.privacy === 'team' ? 'active' : ''}`} onClick={() => updateMutation.mutate({ spaceId: activeSpace.id, updates: { privacy: 'team' } })}><FaUsers /> Team</button>
                    <button className={`privacy-btn ${activeSpace.privacy === 'public' ? 'active' : ''}`} onClick={() => updateMutation.mutate({ spaceId: activeSpace.id, updates: { privacy: 'public' } })}><FaGlobe /> Public</button>
                  </div>
                </div>
                <div className="config-divider"></div>
                <div className="config-group">
                  <button className="header-action" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,0,0,0.1)', borderColor: 'rgba(255,0,0,0.3)' }} onClick={() => window.confirm(`Delete "${activeSpace.name}"?`) && deleteMutation.mutate(activeSpace.id)}>
                    <FaTrash /> Delete Space
                  </button>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Space Modal */}
      <AnimatePresence>
        {(isCreating || showTemplates) && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsCreating(false); setShowTemplates(false); setSelectedTemplate(null); }}>
            <motion.div className="create-space-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              {showTemplates ? (
                <>
                  <div className="modal-header">
                    <h2>Choose Template</h2>
                    <button className="close-btn" onClick={() => { setShowTemplates(false); setSelectedTemplate(null); }}><FaTimes /></button>
                  </div>
                  <div className="templates-grid">
                    {SPACE_TEMPLATES.map(t => {
                      const Icon = t.icon;
                      return (
                        <div key={t.id} className={`template-card ${selectedTemplate === t.id ? 'selected' : ''}`} onClick={() => setSelectedTemplate(t.id)} style={selectedTemplate === t.id ? { borderColor: t.accentColor } : {}}>
                          <div className="template-icon" style={{ color: t.accentColor }}><Icon /></div>
                          <h4>{t.name}</h4>
                          <p>{t.description}</p>
                          <div className="template-badge">{t.widgets.length} widgets</div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedTemplate && (
                    <div className="modal-footer">
                      <input className="modal-input" placeholder="Space name..." value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateSpace()} autoFocus />
                      <div className="modal-actions">
                        <button className="modal-btn cancel" onClick={() => { setShowTemplates(false); setSelectedTemplate(null); }}>Cancel</button>
                        <button className="modal-btn create" onClick={handleCreateSpace} disabled={createMutation.isLoading || !newSpaceName.trim()}>
                          {createMutation.isLoading ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="modal-title">Create Space</h3>
                  <p className="modal-subtitle">Name your space</p>
                  <input className="modal-input" placeholder="e.g., Work, Study..." value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateSpace()} autoFocus />
                  <div className="modal-actions">
                    <button className="modal-btn cancel" onClick={() => setIsCreating(false)}>Cancel</button>
                    <button className="modal-btn create" onClick={handleCreateSpace} disabled={createMutation.isLoading || !newSpaceName.trim()}>
                      {createMutation.isLoading ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// CSS for spinner
const style = document.createElement('style');
style.textContent = `.spinner { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(style);

export default Space;