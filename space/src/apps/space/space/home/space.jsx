import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/index.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { 
  FaCog, FaPlus, FaFolder, FaSpinner,
  FaCrown, FaUsers, FaShare, FaLock, FaUnlock, FaArrowLeft
} from 'react-icons/fa';
import {
  fetchSpaces, fetchSpace, createSpace, updateSpace, deleteSpace,
  addSpaceWidget, removeSpaceWidget, updateSpaceWidget,
  inviteSpaceCollaborator, removeSpaceCollaborator,
  updateWidgetLayouts
} from '../../../../services/space';
import { WIDGET_REGISTRY, SPACE_TEMPLATES, ACCENT_COLORS } from './widget/widgetRegistry';
import WidgetInteraction from './modals/WidgetInteraction';
import WidgetLibraryModal from './modals/WidgetLibraryModal';
import SettingsPanel from './modals/SettingsPanel';
import CreateSpaceModal from './modals/CreateSpaceModal';

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate space path from space object
const generateSpacePath = (space) => {
  const slug = space.slug || space.name.toLowerCase().replace(/\s+/g, '-');
  return `/space/${slug}-${space.id}`;
};

// Extract space ID from path parameter (format: slug-id)
const extractSpaceId = (spaceParam) => {
  if (!spaceParam) return null;
  
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
  // URL format: {slug}-{uuid}
  // Extract the UUID using regex pattern
  
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const match = spaceParam.match(uuidPattern);
  
  if (match) {
    return match[0]; // Return the full UUID
  }
  
  // Fallback: return entire param if no UUID pattern found
  return spaceParam;
};

// ============================================
// MAIN COMPONENT
// ============================================

const Space = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { spaceParam } = useParams(); // This will be "slug-id" format
  
  const [filter, setFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInviteStatus, setShowInviteStatus] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1600);
  const [editModeLayout, setEditModeLayout] = useState(null);

  // Ref for measuring container width
  const containerRef = useRef(null);
  
  // Ref to store the current displayed layout
  const currentDisplayedLayoutRef = useRef([]);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Extract space ID from URL
  const spaceId = extractSpaceId(spaceParam);

  // Fetch all spaces (for navigation tabs)
  const { data: spaces = [], isLoading: spacesLoading, error: spacesError } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => fetchSpaces({ exclude_archived: 'true' }),
    refetchOnWindowFocus: false
  });

  // Fetch the specific space by ID
  const { 
    data: activeSpace, 
    isLoading: spaceLoading, 
    error: spaceError 
  } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: () => fetchSpace(spaceId),
    enabled: !!spaceId, // Only fetch if we have an ID
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on 404
    onError: (error) => {
      console.error('Failed to fetch space:', error);
      // Redirect to space home if space not found
      navigate('/space', { replace: true });
    }
  });

  // Filter spaces for tabs
  const filteredSpaces = spaces.filter(s => {
    if (filter === 'owned') return s.is_owner;
    if (filter === 'shared') return s.is_collaborator && !s.is_owner;
    return true;
  });

  // Verify URL format and redirect if needed
  useEffect(() => {
    if (activeSpace && spaceParam) {
      const correctPath = generateSpacePath(activeSpace);
      const currentPath = `/space/${spaceParam}`;
      
      if (correctPath !== currentPath) {
        navigate(correctPath, { replace: true });
      }
    }
  }, [activeSpace, spaceParam, navigate]);

  // ============================================
  // NAVIGATION HELPER
  // ============================================

  const navigateToSpace = (space) => {
    const path = generateSpacePath(space);
    navigate(path);
  };

  const navigateToSpaceHome = () => {
    navigate('/space');
  };

  // ============================================
  // GRID LAYOUT FUNCTIONS
  // ============================================

  const getGridSize = (size) => {
    switch(size) {
      case 'small': return { w: 3, h: 3, minW: 2, minH: 2 };
      case 'medium': return { w: 4, h: 4, minW: 3, minH: 3 };
      case 'large': return { w: 6, h: 5, minW: 4, minH: 4 };
      default: return { w: 4, h: 4, minW: 3, minH: 3 };
    }
  };

  const generateLayout = (widgets) => {
    if (!widgets) return [];
    
    return widgets.map((widget, index) => {
      // Use stored grid positions if available
      const x = widget.grid_x !== undefined && widget.grid_x !== null 
        ? widget.grid_x 
        : (widget.position_x !== undefined && widget.position_x !== null 
            ? widget.position_x 
            : (index % 3) * 4);
      
      const y = widget.grid_y !== undefined && widget.grid_y !== null
        ? widget.grid_y
        : (widget.position_y !== undefined && widget.position_y !== null
            ? widget.position_y
            : Math.floor(index / 3) * 4);
      
      const w = widget.grid_w !== undefined && widget.grid_w !== null
        ? widget.grid_w
        : getGridSize(widget.size).w;
      
      const h = widget.grid_h !== undefined && widget.grid_h !== null
        ? widget.grid_h
        : getGridSize(widget.size).h;
      
      const gridSize = getGridSize(widget.size);
      
      return {
        i: widget.id,
        x,
        y,
        w,
        h,
        minW: gridSize.minW,
        minH: gridSize.minH,
        maxW: 12,
        maxH: 10
      };
    });
  };

  // Batch update mutation
  const updateLayoutsMutation = useMutation({
    mutationFn: ({ spaceId, layouts }) => updateWidgetLayouts(spaceId, layouts),
    onSuccess: (data, variables) => {
      setEditModeLayout(null);
      queryClient.invalidateQueries(['spaces']);
      queryClient.invalidateQueries(['space', variables.spaceId]);
    },
    onError: (error) => {
      console.error('Failed to update layouts:', error);
      alert('Failed to save layout changes. Please try again.');
      setEditModeLayout(null);
    }
  });

  const handleLayoutChange = (layout) => {
    if (!isEditMode) return;
    setEditModeLayout(layout);
    currentDisplayedLayoutRef.current = layout;
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode - save changes
      if (editModeLayout && editModeLayout.length > 0) {
        const layoutUpdates = editModeLayout.map(item => ({
          widget_id: item.i,
          grid_x: item.x,
          grid_y: item.y,
          grid_w: item.w,
          grid_h: item.h
        }));
        
        updateLayoutsMutation.mutate({
          spaceId: activeSpace.id,
          layouts: layoutUpdates
        });
      }
      setIsEditMode(false);
    } else {
      // Entering edit mode
      const currentLayout = currentDisplayedLayoutRef.current.length > 0 
        ? currentDisplayedLayoutRef.current 
        : generateLayout(activeSpace?.widgets || []);
      
      setEditModeLayout(currentLayout);
      setIsEditMode(true);
    }
  };

  // Generate layout for the grid
  const layout = React.useMemo(() => {
    let baseLayout;
    
    if (isEditMode && editModeLayout) {
      baseLayout = editModeLayout;
    } else {
      baseLayout = generateLayout(activeSpace?.widgets || []);
      currentDisplayedLayoutRef.current = baseLayout;
    }
    
    return baseLayout.map(item => ({
      ...item,
      static: !isEditMode
    }));
  }, [activeSpace?.widgets, isEditMode, editModeLayout]);

  // ============================================
  // MUTATIONS
  // ============================================

  const createMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: async (newSpace, variables) => {
      await queryClient.invalidateQueries(['spaces']);
      setIsCreating(false);
      setShowTemplates(false);
      
      // Navigate to the new space using slug-id format
      const path = generateSpacePath(newSpace);
      navigate(path);
      
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
    onSuccess: (updatedSpace) => {
      queryClient.invalidateQueries(['spaces']);
      queryClient.invalidateQueries(['space', updatedSpace?.id]);
      
      // If name or slug was updated, navigate to new URL
      if (updatedSpace) {
        const newPath = generateSpacePath(updatedSpace);
        const currentPath = `/space/${spaceParam}`;
        
        if (newPath !== currentPath) {
          navigate(newPath, { replace: true });
        }
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSpace,
    onSuccess: () => {
      queryClient.invalidateQueries(['spaces']);
      setShowConfig(false);
      
      // Navigate back to space home
      navigate('/space', { replace: true });
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
      await queryClient.invalidateQueries(['spaces']);
      await queryClient.invalidateQueries(['space', variables.spaceId]);
      setShowWidgetLibrary(false);
    }
  });

  const removeWidgetMutation = useMutation({
    mutationFn: ({ spaceId, widgetId }) => removeSpaceWidget(spaceId, widgetId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['spaces']);
      queryClient.invalidateQueries(['space', variables.spaceId]);
    }
  });

  const inviteMutation = useMutation({
    mutationFn: ({ spaceId, email }) => inviteSpaceCollaborator(spaceId, email),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['spaces']);
      queryClient.invalidateQueries(['space', variables.spaceId]);
      setShowInviteStatus(true);
      setTimeout(() => setShowInviteStatus(false), 3000);
    }
  });

  const removeCollabMutation = useMutation({
    mutationFn: ({ spaceId, userId }) => removeSpaceCollaborator(spaceId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['spaces']);
      queryClient.invalidateQueries(['space', variables.spaceId]);
    }
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
      selectedTemplate
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

  const isLoading = spacesLoading || spaceLoading;
  const error = spacesError || spaceError;

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
          <p style={{ color: '#ff006e', marginBottom: '16px' }}>
            {error.message || 'Failed to load'}
          </p>
          <button 
            className="empty-btn" 
            onClick={() => {
              queryClient.invalidateQueries(['spaces']);
              queryClient.invalidateQueries(['space', spaceId]);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If no space found
  if (!activeSpace) {
    return (
      <div className="space-wrapper">
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div className="empty-icon">🔍</div>
          <h2 style={{ marginBottom: '8px' }}>Space Not Found</h2>
          <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.6)' }}>
            The space you're looking for doesn't exist or you don't have access to it.
          </p>
          <button className="empty-btn" onClick={navigateToSpaceHome}>
            <FaArrowLeft /> Back to Spaces
          </button>
        </div>
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
          <button 
            className="back-button"
            onClick={navigateToSpaceHome}
            title="Back to Spaces"
          >
            <FaArrowLeft />
          </button>
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
              onClick={() => navigateToSpace(s)} 
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
        <main className="space-main" ref={containerRef}>
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
                    className={`header-action ${isEditMode ? 'active' : ''}`}
                    onClick={handleToggleEditMode}
                    style={isEditMode ? { 
                      background: `${currentAccentColor}20`,
                      borderColor: currentAccentColor
                    } : {}}
                    disabled={updateLayoutsMutation.isLoading}
                  >
                    {updateLayoutsMutation.isLoading ? (
                      <FaSpinner className="spinner" />
                    ) : (
                      isEditMode ? <FaUnlock /> : <FaLock />
                    )} 
                    {updateLayoutsMutation.isLoading ? 'Saving...' : (isEditMode ? 'Save & Exit' : 'Edit Layout')}
                  </button>
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
                  {isEditMode && (
                    <span className="edit-mode-indicator">
                      Drag to reposition • Resize from bottom-right corner • Click "Save & Exit" to persist changes
                    </span>
                  )}
                </div>
                
                {activeSpace.widgets?.length > 0 ? (
                  <ResponsiveGridLayout
                    className="widgets-grid-layout"
                    layouts={{ lg: layout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={60}
                    width={containerWidth}
                    isDraggable={isEditMode}
                    isResizable={isEditMode}
                    onLayoutChange={handleLayoutChange}
                    draggableHandle=".widget-drag-handle"
                    margin={[16, 16]}
                    containerPadding={[0, 0]}
                    compactType="vertical"
                    preventCollision={false}
                    useCSSTransforms={true}
                    isBounded={true}
                    bounds="parent"
                    maxRows={Infinity}
                    autoSize={true}
                  >
                    {activeSpace.widgets.map((w) => (
                      <div key={w.id} className="grid-widget-wrapper">
                        <WidgetInteraction
                          widget={w}
                          accentColor={currentAccentColor}
                          spaceId={activeSpace.id}
                          onRemove={() => handleRemoveWidget(w.id)}
                          isEditMode={isEditMode}
                        />
                      </div>
                    ))}
                  </ResponsiveGridLayout>
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