import React, { useState, useEffect } from 'react';
import './space.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FaCog, FaPlus, FaFolder, FaSpinner,
  FaCrown, FaUsers, FaShare
} from 'react-icons/fa';
import {
  fetchSpaces, createSpace, updateSpace, deleteSpace,
  addSpaceWidget, removeSpaceWidget,
  inviteSpaceCollaborator, removeSpaceCollaborator
} from '../../../services/space';
import { WIDGET_REGISTRY, SPACE_TEMPLATES, ACCENT_COLORS } from './widgetRegistry';
import WidgetInteraction from './WidgetInteraction';

import WidgetLibraryModal from './modals/WidgetLibraryModal';
import SettingsPanel from './modals/SettingsPanel';
import CreateSpaceModal from './modals/CreateSpaceModal';

// ============================================
// MAIN COMPONENT
// ============================================

const Space = () => {
  const queryClient = useQueryClient();
  const [activeSpace, setActiveSpace] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInviteStatus, setShowInviteStatus] = useState(false);

  // Fetch spaces
  const { data: spaces = [], isLoading, error } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => fetchSpaces({ exclude_archived: 'true' }),
    refetchOnWindowFocus: false
  });

  // Filter spaces
  const filteredSpaces = spaces.filter(s => {
    if (filter === 'owned') return s.is_owner;
    if (filter === 'shared') return s.is_collaborator && !s.is_owner;
    return true;
  });

  // Set active space
  useEffect(() => {
    if (filteredSpaces.length > 0 && !activeSpace) {
      setActiveSpace(filteredSpaces[0]);
    }
  }, [filteredSpaces]);

  // Update active space when spaces change
  useEffect(() => {
    if (activeSpace && spaces.length > 0) {
      const updated = spaces.find(s => s.id === activeSpace.id);
      if (updated) setActiveSpace(updated);
    }
  }, [spaces]);

  // ============================================
  // MUTATIONS
  // ============================================

  const createMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: async (newSpace, variables) => {
      await queryClient.invalidateQueries(['spaces']);
      setActiveSpace(newSpace);
      setIsCreating(false);
      setShowTemplates(false);
      
      // Add template widgets if selected
      const { selectedTemplate } = variables;
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
                config: widget.defaultConfig || {}
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
      setShowConfig(false);
    }
  });

  const addWidgetMutation = useMutation({
    mutationFn: ({ spaceId, widget }) => addSpaceWidget(spaceId, {
      widget_type: widget.id,
      name: widget.name,
      description: widget.description,
      size: widget.size,
      config: widget.defaultConfig || {}
    }),
    onSuccess: async (newWidget, variables) => {
      // Optimistically update the cache
      queryClient.setQueryData(['spaces'], (oldSpaces) => {
        if (!oldSpaces) return oldSpaces;
        
        return oldSpaces.map(space => {
          if (space.id === variables.spaceId) {
            return {
              ...space,
              widgets: [...(space.widgets || []), newWidget]
            };
          }
          return space;
        });
      });
      
      // Also update activeSpace state immediately
      if (activeSpace && activeSpace.id === variables.spaceId) {
        setActiveSpace(prev => ({
          ...prev,
          widgets: [...(prev.widgets || []), newWidget]
        }));
      }
      
      // Then invalidate to ensure consistency
      await queryClient.invalidateQueries(['spaces']);
      
      setShowWidgetLibrary(false);
    }
  });

  const removeWidgetMutation = useMutation({
    mutationFn: ({ spaceId, widgetId }) => removeSpaceWidget(spaceId, widgetId),
    onSuccess: () => queryClient.invalidateQueries(['spaces'])
  });

  const inviteMutation = useMutation({
    mutationFn: ({ spaceId, email }) => inviteSpaceCollaborator(spaceId, email),
    onSuccess: () => {
      queryClient.invalidateQueries(['spaces']);
      setShowInviteStatus(true);
      setTimeout(() => setShowInviteStatus(false), 3000);
    }
  });

  const removeCollabMutation = useMutation({
    mutationFn: ({ spaceId, userId }) => removeSpaceCollaborator(spaceId, userId),
    onSuccess: () => queryClient.invalidateQueries(['spaces'])
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreateSpace = (spaceName, selectedTemplate) => {
    const template = selectedTemplate ? SPACE_TEMPLATES.find(t => t.id === selectedTemplate) : null;
    
    createMutation.mutate({
      name: spaceName,
      definition: template?.definition || 'Define your space...',
      type: template?.type || 'personal',
      privacy: 'private',
      accent_color: template?.accentColor || ACCENT_COLORS[0],
      config: {},
      selectedTemplate // Pass this to onSuccess
    });
  };

  const handleUpdateSpace = (updates) => {
    if (activeSpace) {
      updateMutation.mutate({ 
        spaceId: activeSpace.id, 
        updates 
      });
    }
  };

  const handleDeleteSpace = () => {
    if (activeSpace) {
      deleteMutation.mutate(activeSpace.id);
    }
  };

  const handleAddWidget = (widget) => {
    if (activeSpace) {
      addWidgetMutation.mutate({ 
        spaceId: activeSpace.id, 
        widget 
      });
    }
  };

  const handleRemoveWidget = (widgetId) => {
    if (activeSpace && window.confirm('Remove this widget?')) {
      removeWidgetMutation.mutate({ 
        spaceId: activeSpace.id, 
        widgetId 
      });
    }
  };

  const handleInviteCollaborator = (email) => {
    if (activeSpace) {
      inviteMutation.mutate({ 
        spaceId: activeSpace.id, 
        email 
      });
    }
  };

  const handleRemoveCollaborator = (userId) => {
    if (activeSpace) {
      removeCollabMutation.mutate({ 
        spaceId: activeSpace.id, 
        userId 
      });
    }
  };

  const currentAccentColor = activeSpace?.accent_color || ACCENT_COLORS[0];

  // ============================================
  // LOADING & ERROR STATES
  // ============================================

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

  if (error) {
    return (
      <div className="space-wrapper">
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <p style={{ color: '#ff006e', marginBottom: '16px' }}>Failed to load</p>
          <button 
            className="empty-btn" 
            onClick={() => queryClient.invalidateQueries(['spaces'])}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================

  if (!activeSpace && spaces.length === 0) {
    return (
      <div className="space-wrapper">
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div className="empty-icon">🚀</div>
          <h2 style={{ marginBottom: '8px' }}>Welcome to Spaces</h2>
          <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.6)' }}>
            Create your first space
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="empty-btn" onClick={() => setShowTemplates(true)}>
              🎨 Use Template
            </button>
            <button className="empty-btn" onClick={() => setIsCreating(true)}>
              <FaPlus /> Start from Scratch
            </button>
          </div>
        </div>
        
        <CreateSpaceModal
          isOpen={isCreating || showTemplates}
          onClose={() => {
            setIsCreating(false);
            setShowTemplates(false);
          }}
          onCreate={handleCreateSpace}
          showTemplates={showTemplates}
          setShowTemplates={setShowTemplates}
          isLoading={createMutation.isLoading}
        />
      </div>
    );
  }

  // ============================================
  // MAIN UI
  // ============================================

  return (
    <div className="space-wrapper">
      <div className="bg-grid"></div>
      <div 
        className="bg-glow" 
        style={{ 
          background: `radial-gradient(circle at 20% 30%, ${currentAccentColor}15 0%, transparent 50%)` 
        }}
      ></div>
      <div 
        className="bg-glow-2" 
        style={{ 
          background: `radial-gradient(circle at 80% 70%, ${currentAccentColor}10 0%, transparent 50%)` 
        }}
      ></div>

      {/* Navigation */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="brand-mark"></div>
          <span className="brand-text">SPACES</span>
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`} 
            onClick={() => setFilter('all')}
          >
            <FaFolder /> All ({spaces.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'owned' ? 'active' : ''}`} 
            onClick={() => setFilter('owned')}
          >
            <FaCrown /> Owned ({spaces.filter(s => s.is_owner).length})
          </button>
          <button 
            className={`filter-tab ${filter === 'shared' ? 'active' : ''}`} 
            onClick={() => setFilter('shared')}
          >
            <FaUsers /> Shared ({spaces.filter(s => s.is_collaborator && !s.is_owner).length})
          </button>
        </div>

        <div className="nav-tabs">
          {filteredSpaces.map(s => (
            <motion.button 
              key={s.id} 
              className={`nav-tab ${activeSpace?.id === s.id ? 'active' : ''}`} 
              onClick={() => setActiveSpace(s)} 
              whileHover={{ y: -1 }}
            >
              <span 
                className="tab-glow" 
                style={{ background: s.accent_color || ACCENT_COLORS[0] }}
              ></span>
              <span className="tab-label">{s.name}</span>
              {s.is_owner && (
                <FaCrown style={{ fontSize: '10px', opacity: 0.6, color: '#ffd700' }} />
              )}
              {s.is_collaborator && !s.is_owner && (
                <FaUsers style={{ fontSize: '10px', opacity: 0.6 }} />
              )}
              {s.widgets?.length > 0 && (
                <span className="tab-count">{s.widgets.length}</span>
              )}
            </motion.button>
          ))}
          <motion.button 
            className="nav-tab new" 
            onClick={() => setShowTemplates(true)} 
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
          >
            <FaCog />
          </button>
          <button 
            className="nav-icon-btn" 
            onClick={() => setShowConfig(true)}
          >
            <FaShare />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      {activeSpace && (
        <main className="space-main">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeSpace.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }} 
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <div className="space-header">
                <div className="header-content">
                  <div 
                    className="space-indicator" 
                    style={{ 
                      boxShadow: `0 0 20px ${currentAccentColor}60, inset 0 0 10px ${currentAccentColor}40` 
                    }}
                  >
                    <div 
                      className="indicator-inner" 
                      style={{ background: currentAccentColor }}
                    ></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h1 className="space-name">{activeSpace.name}</h1>
                      {activeSpace.is_owner && (
                        <span className="owner-badge">
                          <FaCrown /> Owner
                        </span>
                      )}
                      {activeSpace.is_collaborator && !activeSpace.is_owner && (
                        <span className="collab-badge">
                          <FaUsers /> Collaborator
                        </span>
                      )}
                    </div>
                    <p className="space-desc">{activeSpace.definition}</p>
                    {activeSpace.collaborators?.length > 0 && (
                      <div className="space-collaborators">
                        <FaUsers style={{ fontSize: '12px' }} />
                        <span>
                          {activeSpace.collaborators.length} collaborator
                          {activeSpace.collaborators.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="header-actions">
                  <button 
                    className="header-action" 
                    onClick={() => setShowWidgetLibrary(true)}
                  >
                    <FaPlus /> Add Widget
                  </button>
                  {activeSpace.is_owner && (
                    <button 
                      className="header-action" 
                      onClick={() => setShowConfig(true)}
                    >
                      <FaCog /> Settings
                    </button>
                  )}
                </div>
              </div>

              {/* Widgets */}
              <section className="content-section">
                <div className="section-head">
                  <h2 className="section-title">
                    <span 
                      className="title-accent" 
                      style={{ color: currentAccentColor }}
                    >
                      ∎
                    </span>
                    Active Widgets
                  </h2>
                </div>
                <div className="widgets-container">
                  {activeSpace.widgets?.length > 0 ? (
                    activeSpace.widgets.map((w) => (
                      <WidgetInteraction
                        key={w.id}
                        widget={w}
                        accentColor={currentAccentColor}
                        spaceId={activeSpace.id}
                        onRemove={() => handleRemoveWidget(w.id)}
                      />
                    ))
                  ) : (
                    <div className="empty-message">
                      <div className="empty-icon">💡</div>
                      <p>No widgets yet</p>
                      <button 
                        className="empty-btn" 
                        onClick={() => setShowWidgetLibrary(true)}
                      >
                        <FaPlus /> Add Widget
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {/* Modals */}
      <WidgetLibraryModal
        isOpen={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        onAddWidget={handleAddWidget}
        currentAccentColor={currentAccentColor}
        isLoading={addWidgetMutation.isLoading}
      />

      <SettingsPanel
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        space={activeSpace}
        onUpdate={handleUpdateSpace}
        onDelete={handleDeleteSpace}
        onInvite={handleInviteCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        inviteMutation={inviteMutation}
        updateMutation={updateMutation}
        showInviteStatus={showInviteStatus}
        setShowInviteStatus={setShowInviteStatus}
      />

      <CreateSpaceModal
        isOpen={isCreating || showTemplates}
        onClose={() => {
          setIsCreating(false);
          setShowTemplates(false);
        }}
        onCreate={handleCreateSpace}
        showTemplates={showTemplates}
        setShowTemplates={setShowTemplates}
        isLoading={createMutation.isLoading}
      />
    </div>
  );
};

export default Space;