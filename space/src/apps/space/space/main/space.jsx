import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/index.css';
import './widgets/finance/styles/financeWidgets.css';
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
import { WIDGET_REGISTRY, SPACE_TEMPLATES, ACCENT_COLORS } from './utils/widgetRegistry';
import WidgetInteraction from './modals/WidgetInteraction';
import WidgetLibraryModal from './modals/WidgetLibraryModal';
import SettingsPanel from './modals/SettingsPanel';
import CreateSpaceModal from './modals/CreateSpaceModal';

// ============================================
// FINANCE WIDGET IMPORTS
// ============================================
import PortfolioWidget from './widgets/finance/apps/PortfolioWidget/PortfolioWidget';
import ExpensesWidget from './widgets/finance/apps/ExpensesWidget/ExpensesWidget';
import BudgetWidget from './widgets/finance/apps/BudgetWidget/BudgetWidget';
import CryptoWidget from './widgets/finance/apps/CryptoWidget/CryptoWidget';
import TradingWidget from './widgets/finance/apps/TradingWidget/TradingWidget';
import InvoicingWidget from './widgets/finance/apps/InvoicingWidget/InvoicingWidget';

// ============================================
// WIDGET COMPONENT MAPPING
// ============================================
const WIDGET_COMPONENTS = {
  'portfolio-manager': PortfolioWidget,
  'expenses': ExpensesWidget,
  'budget-manager': BudgetWidget,
  'crypto-tracker': CryptoWidget,
  'trading-terminal': TradingWidget,
  'invoicing': InvoicingWidget,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateSpacePath = (space) => {
  const slug = space.slug || space.name.toLowerCase().replace(/\s+/g, '-');
  return `/space/${slug}-${space.id}`;
};

const extractSpaceId = (spaceParam) => {
  if (!spaceParam) return null;
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const match = spaceParam.match(uuidPattern);
  if (match) return match[0];
  return spaceParam;
};

// ============================================
// MAIN COMPONENT
// ============================================

const Space = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { spaceParam } = useParams();
  
  const [filter, setFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInviteStatus, setShowInviteStatus] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1600);
  const [editModeLayout, setEditModeLayout] = useState(null);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  const containerRef = useRef(null);
  const currentDisplayedLayoutRef = useRef([]);

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

  const spaceId = extractSpaceId(spaceParam);

  const { data: spaces = [], isLoading: spacesLoading, error: spacesError } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => fetchSpaces({ exclude_archived: 'true' }),
    refetchOnWindowFocus: false
  });

  const { 
    data: activeSpace, 
    isLoading: spaceLoading, 
    error: spaceError 
  } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: () => fetchSpace(spaceId),
    enabled: !!spaceId,
    refetchOnWindowFocus: false,
    retry: false,
    onError: (error) => {
      console.error('Failed to fetch space:', error);
      navigate('/space', { replace: true });
    }
  });

  const filteredSpaces = spaces.filter(s => {
    if (filter === 'owned') return s.is_owner;
    if (filter === 'shared') return s.is_collaborator && !s.is_owner;
    return true;
  });

  useEffect(() => {
    if (activeSpace && spaceParam) {
      const correctPath = generateSpacePath(activeSpace);
      const currentPath = `/space/${spaceParam}`;
      if (correctPath !== currentPath) {
        navigate(correctPath, { replace: true });
      }
    }
  }, [activeSpace, spaceParam, navigate]);

  const navigateToSpace = (space) => {
    const path = generateSpacePath(space);
    navigate(path);
  };

  const navigateToSpaceHome = () => {
    navigate('/space');
  };

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
    
    return widgets.map((widget) => {
      const hasExplicitPosition = (
        widget.grid_x !== undefined && widget.grid_x !== null &&
        widget.grid_y !== undefined && widget.grid_y !== null
      );

      const hasExplicitSize = (
        widget.grid_w !== undefined && widget.grid_w !== null &&
        widget.grid_h !== undefined && widget.grid_h !== null
      );

      let x, y, w, h;
      
      if (hasExplicitPosition) {
        x = widget.grid_x;
        y = widget.grid_y;
      } else {
        const widgetIndex = widgets.indexOf(widget);
        x = widget.position_x !== undefined && widget.position_x !== null 
          ? widget.position_x 
          : (widgetIndex % 3) * 4;
        
        y = widget.position_y !== undefined && widget.position_y !== null
          ? widget.position_y
          : Math.floor(widgetIndex / 3) * 4;
      }

      if (hasExplicitSize) {
        w = widget.grid_w;
        h = widget.grid_h;
      } else {
        const gridSize = getGridSize(widget.size);
        w = gridSize.w;
        h = gridSize.h;
      }
      
      const gridSize = getGridSize(widget.size);
      
      return {
        i: widget.id,
        x, y, w, h,
        minW: gridSize.minW,
        minH: gridSize.minH,
        maxW: 12,
        maxH: 10,
        static: !isEditMode && hasExplicitPosition && hasExplicitSize
      };
    });
  };

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
      const currentLayout = currentDisplayedLayoutRef.current.length > 0 
        ? currentDisplayedLayoutRef.current 
        : generateLayout(activeSpace?.widgets || []);
      setEditModeLayout(currentLayout);
      setIsEditMode(true);
    }
  };

  const layout = React.useMemo(() => {
    let baseLayout;
    if (isEditMode && editModeLayout) {
      baseLayout = editModeLayout;
    } else {
      const newLayout = generateLayout(activeSpace?.widgets || []);
      
      const previousLayout = currentDisplayedLayoutRef.current;
      const mergedLayout = newLayout.map(item => {
        const prevItem = previousLayout.find(p => p.i === item.i);
        if (prevItem && 
            prevItem.x === item.x && 
            prevItem.y === item.y && 
            prevItem.w === item.w && 
            prevItem.h === item.h) {
          return prevItem;
        }
        return item;
      });
      
      baseLayout = mergedLayout;
      currentDisplayedLayoutRef.current = baseLayout;
    }
    return baseLayout.map(item => ({
      ...item,
      static: !isEditMode
    }));
  }, [activeSpace?.widgets, isEditMode, editModeLayout]);

  const createMutation = useMutation({
    mutationFn: async (spaceData) => {
      console.log('🌐 Calling createSpace API with data:', spaceData);
      try {
        const result = await createSpace(spaceData);
        console.log('✅ API Response:', result);
        return result;
      } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
      }
    },
    onSuccess: async (newSpace, variables) => {
      console.log('✅ createMutation onSuccess:', newSpace);
      await queryClient.invalidateQueries(['spaces']);
      setIsCreating(false);
      setShowTemplates(false);
      
      const path = generateSpacePath(newSpace);
      console.log('📍 Navigating to:', path);
      navigate(path);
      
      const { selectedTemplate } = variables;
      if (selectedTemplate) {
        console.log('🎨 Adding widgets for template:', selectedTemplate);
        const template = SPACE_TEMPLATES.find(t => t.id === selectedTemplate);
        if (template?.widgets) {
          for (const widgetId of template.widgets) {
            const widget = WIDGET_REGISTRY.find(w => w.id === widgetId);
            if (widget) {
              console.log('➕ Adding widget:', widget.name);
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
    },
    onError: (error) => {
      console.error('❌ createMutation onError:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      alert('Failed to create space: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ spaceId, updates }) => updateSpace(spaceId, updates),
    onSuccess: (updatedSpace) => {
      queryClient.invalidateQueries(['spaces']);
      queryClient.invalidateQueries(['space', updatedSpace?.id]);
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
      navigate('/space', { replace: true });
    }
  });

  const addWidgetMutation = useMutation({
    mutationFn: async ({ spaceId, widget, explicitY }) => {
      let finalY;
      
      if (typeof explicitY === 'number') {
        finalY = explicitY;
        console.log(`  ✓ Using pre-calculated position: Y=${finalY}`);
      } else {
        const existingWidgets = activeSpace?.widgets || [];
        let maxYPosition = 0;
        
        if (existingWidgets.length > 0) {
          existingWidgets.forEach(w => {
            const y = w.grid_y !== undefined && w.grid_y !== null ? w.grid_y : (w.position_y || 0);
            const h = w.grid_h !== undefined && w.grid_h !== null ? w.grid_h : getGridSize(w.size).h;
            const bottomY = y + h;
            if (bottomY > maxYPosition) {
              maxYPosition = bottomY;
            }
          });
        }
        
        finalY = maxYPosition;
        console.log(`  🎯 Calculated position: Y=${finalY} (${existingWidgets.length} existing widgets)`);
      }

      const widgetSize = getGridSize(widget.size);
      
      const newWidgetData = {
        widget_type: widget.id,
        name: widget.name,
        description: widget.description,
        size: widget.size,
        config: widget.defaultConfig || {},
        grid_x: 0,
        grid_y: finalY,
        grid_w: widgetSize.w,
        grid_h: widgetSize.h
      };

      console.log(`➕ Adding: ${widget.name} at (0, ${finalY}) size ${widgetSize.w}×${widgetSize.h}`);

      return await addSpaceWidget(spaceId, newWidgetData);
    },
    onSuccess: async (newWidget, variables) => {
      console.log(`✅ Added: ${newWidget.name || newWidget.widget_type}`);
      
      await queryClient.invalidateQueries(['spaces']);
      await queryClient.invalidateQueries(['space', variables.spaceId]);
    },
    onError: (error) => {
      console.error('❌ Error adding widget:', error);
      alert('Failed to add widget: ' + (error.response?.data?.detail || error.message));
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

  const handleCreateSpace = (spaceName, selectedTemplate, description) => {
    console.log('🎯 handleCreateSpace called!');
    console.log('Space name:', spaceName);
    console.log('Selected template:', selectedTemplate);
    console.log('Description:', description);
    
    if (!spaceName || !spaceName.trim()) {
      console.error('❌ Invalid space name');
      alert('Space name is required');
      return;
    }

    const template = selectedTemplate ? SPACE_TEMPLATES.find(t => t.id === selectedTemplate) : null;
    console.log('Template data:', template);
    
    const spaceData = {
      name: spaceName,
      definition: description || template?.definition || 'Define your space...',
      type: template?.type || 'personal',
      privacy: 'private',
      accent_color: template?.accentColor || ACCENT_COLORS[0],
      config: {},
      selectedTemplate
    };
    
    console.log('📦 Creating space with data:', spaceData);
    console.log('📡 Calling createMutation.mutate...');
    
    createMutation.mutate(spaceData, {
      onError: (error) => {
        console.error('❌ Error creating space:', error);
        console.error('Error details:', error.response?.data || error.message);
        alert('Failed to create space: ' + (error.response?.data?.message || error.message));
      },
      onSuccess: (data) => {
        console.log('✅ Space created successfully:', data);
      }
    });
  };

  const handleUpdateSpace = (updates) => {
    if (activeSpace) {
      updateMutation.mutate({ spaceId: activeSpace.id, updates });
    }
  };

  const handleDeleteSpace = () => {
    if (activeSpace) {
      deleteMutation.mutate(activeSpace.id);
    }
  };

  const handleAddWidget = async (widget, explicitY) => {
    if (activeSpace) {
      try {
        await addWidgetMutation.mutateAsync({ 
          spaceId: activeSpace.id, 
          widget,
          explicitY 
        });
        
        if (explicitY === undefined) {
          setShowWidgetLibrary(false);
        }
      } catch (error) {
        console.error('Failed to add widget:', error);
      }
    }
  };

  const handleRemoveWidget = (widgetId) => {
    if (activeSpace && window.confirm('Remove this widget?')) {
      removeWidgetMutation.mutate({ spaceId: activeSpace.id, widgetId });
    }
  };

  const handleInviteCollaborator = (email) => {
    if (activeSpace) {
      inviteMutation.mutate({ spaceId: activeSpace.id, email });
    }
  };

  const handleRemoveCollaborator = (userId) => {
    if (activeSpace) {
      removeCollabMutation.mutate({ spaceId: activeSpace.id, userId });
    }
  };

  // Handle widget click to open modal
  const handleWidgetClick = (widget) => {
    if (isEditMode) return; // Don't open modal in edit mode
    setSelectedWidget(widget);
    setIsWidgetModalOpen(true);
  };

  // Render widget content based on type
  const renderWidgetContent = (widget, mode = 'compact') => {
    const WidgetComponent = WIDGET_COMPONENTS[widget.widget_type];
    
    if (!WidgetComponent) {
      // Fallback for non-finance widgets - use WidgetInteraction
      return null;
    }

    return (
      <WidgetComponent
        widget={widget}
        spaceId={activeSpace?.id}
        mode={mode}
        isCompact={mode === 'compact'}
      />
    );
  };

  const currentAccentColor = activeSpace?.accent_color || ACCENT_COLORS[0];
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

  return (
    <div className="space-wrapper">
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
                    compactType={null}
                    preventCollision={true}
                    useCSSTransforms={true}
                    isBounded={true}
                    bounds="parent"
                    maxRows={Infinity}
                    autoSize={true}
                  >
                    {activeSpace.widgets.map((w) => {
                      const widgetContent = renderWidgetContent(w, 'compact');
                      
                      // If finance widget, wrap in custom container with click handler
                      if (widgetContent) {
                        return (
                          <div key={w.id} className="grid-widget-wrapper">
                            <div 
                              className="finance-widget-card"
                              onClick={() => handleWidgetClick(w)}
                              style={{ cursor: isEditMode ? 'move' : 'pointer' }}
                            >
                              {widgetContent}
                            </div>
                          </div>
                        );
                      }
                      
                      // Otherwise use existing WidgetInteraction
                      return (
                        <div key={w.id} className="grid-widget-wrapper">
                          <WidgetInteraction
                            widget={w}
                            accentColor={currentAccentColor}
                            spaceId={activeSpace.id}
                            onRemove={() => handleRemoveWidget(w.id)}
                            isEditMode={isEditMode}
                          />
                        </div>
                      );
                    })}
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
        addedWidgets={activeSpace?.widgets?.map(w => w.widget_type) || []}
        existingWidgets={activeSpace?.widgets || []}
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
        isLoading={createMutation.isLoading}
      />

      {/* Finance Widget Modal */}
      {isWidgetModalOpen && selectedWidget && WIDGET_COMPONENTS[selectedWidget.widget_type] && (
        <div className="widget-modal-overlay" onClick={() => setIsWidgetModalOpen(false)}>
          <div className="widget-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="widget-modal-header">
              <h2>{selectedWidget.name}</h2>
              <button 
                className="widget-modal-close"
                onClick={() => setIsWidgetModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="widget-modal-content">
              {renderWidgetContent(selectedWidget, 'full')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Space;