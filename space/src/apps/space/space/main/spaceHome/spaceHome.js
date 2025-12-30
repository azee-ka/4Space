import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FaPlus, FaFolder, FaSpinner, FaCrown, FaUsers,
  FaLock, FaCog, FaCalendar, FaChartLine, FaPalette, FaRocket
} from 'react-icons/fa';
import { fetchSpaces, createSpace, addSpaceWidget } from '../../../../../services/space';
import { WIDGET_REGISTRY, SPACE_TEMPLATES, ACCENT_COLORS } from '../utils/widgetRegistry';
import CreateSpaceModal from '../modals/CreateSpaceModal';
import './spaceHome.css';

const generateSpacePath = (space) => {
  const slug = space.slug || space.name.toLowerCase().replace(/\s+/g, '-');
  return `/space/${slug}-${space.id}`;
};

const SpaceHome = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const createMutation = useMutation({
    mutationFn: async (spaceData) => {
      return await createSpace(spaceData);
    },
    onSuccess: async (newSpace, variables) => {
      await queryClient.invalidateQueries(['spaces']);

      // Close modal states
      setShowCreateModal(false);
      setShowTemplates(false);

      // Navigate to the newly created space
      navigate(generateSpacePath(newSpace));

      // If a template was selected, seed widgets
      const { selectedTemplate } = variables || {};
      if (selectedTemplate) {
        const template = SPACE_TEMPLATES.find(t => t.id === selectedTemplate);
        if (template?.widgets?.length) {
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
    },
    onError: (error) => {
      console.error('❌ Failed to create space:', error);
      alert('Failed to create space: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    }
  });

  const handleCreateSpace = (spaceName, selectedTemplate, description) => {
    if (!spaceName || !spaceName.trim()) {
      alert('Space name is required');
      return;
    }

    const template = selectedTemplate ? SPACE_TEMPLATES.find(t => t.id === selectedTemplate) : null;

    const spaceData = {
      name: spaceName,
      definition: description || template?.definition || 'Define your space...',
      type: template?.type || 'personal',
      privacy: 'private',
      accent_color: template?.accentColor || ACCENT_COLORS[0],
      config: {},
      selectedTemplate
    };

    createMutation.mutate(spaceData);
  };

  // Fetch spaces
  const { data: spaces = [], isLoading, error } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => fetchSpaces({ exclude_archived: 'true' }),
    refetchOnWindowFocus: false
  });

  // Filter spaces
  const filteredSpaces = spaces.filter(s => {
    // Apply ownership filter
    let matchesFilter = true;
    if (filter === 'owned') matchesFilter = s.is_owner;
    if (filter === 'shared') matchesFilter = s.is_collaborator && !s.is_owner;
    
    // Apply search query
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matchesSearch = 
        s.name.toLowerCase().includes(query) ||
        s.definition?.toLowerCase().includes(query) ||
        s.type?.toLowerCase().includes(query);
    }
    
    return matchesFilter && matchesSearch;
  });

  // Navigate to space
  const handleSpaceClick = (space) => {
    // Format: /space/{slug}-{id}
    const path = space.slug 
      ? `/space/${space.slug}-${space.id}`
      : `/space/${space.name.toLowerCase().replace(/\s+/g, '-')}-${space.id}`;
    navigate(path);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-home-wrapper">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading your spaces...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-home-wrapper">
        <div className="error-container">
          <p className="error-message">Failed to load spaces</p>
          <button 
            className="retry-btn" 
            onClick={() => queryClient.invalidateQueries(['spaces'])}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (spaces.length === 0) {
    return (
      <div className="space-home-wrapper">
        <div className="bg-grid"></div>
        <div className="bg-glow"></div>
        
        <div className="empty-state">
          <div className="empty-icon"><FaRocket /></div>
          <h1 className="empty-title">Welcome to Spaces</h1>
          <p className="empty-description">
            Create your first space to organize your projects, research, and workflows
          </p>
          <div className="empty-actions">
            <button
              className="primary-btn"
              onClick={() => setShowTemplates(true)}
            >
              <FaPalette /> Use Template
            </button>
            <button 
              className="secondary-btn" 
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus /> Start from Scratch
            </button>
          </div>
        </div>
        <CreateSpaceModal
          isOpen={showCreateModal || showTemplates}
          onClose={() => {
            setShowCreateModal(false);
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

  return (
    <div className="space-home-wrapper">
      <div className="bg-grid"></div>
      <div className="bg-glow"></div>
      
      {/* Header */}
      <header className="space-home-header">
        <div className="header-top">
          <div className="header-brand">
            <div className="brand-icon">
              <div className="brand-mark"></div>
            </div>
            <div>
              <h1 className="header-title">Spaces</h1>
              <p className="header-subtitle">
                {spaces.length} {spaces.length === 1 ? 'space' : 'spaces'} • 
                {' '}{spaces.filter(s => s.is_owner).length} owned • 
                {' '}{spaces.filter(s => s.is_collaborator && !s.is_owner).length} shared
              </p>
            </div>
          </div>

          <button 
            className="create-space-btn"
            onClick={() => setShowTemplates(true)}
          >
            <FaPlus /> New Space
          </button>
        </div>

        <div className="header-controls">
          {/* Search */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filters */}
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <FaFolder /> All
            </button>
            <button 
              className={`filter-btn ${filter === 'owned' ? 'active' : ''}`}
              onClick={() => setFilter('owned')}
            >
              <FaCrown /> Owned
            </button>
            <button 
              className={`filter-btn ${filter === 'shared' ? 'active' : ''}`}
              onClick={() => setFilter('shared')}
            >
              <FaUsers /> Shared
            </button>
          </div>
        </div>
      </header>

      {/* Spaces Grid */}
      <main className="spaces-grid-container">
        {filteredSpaces.length === 0 ? (
          <div className="no-results">
            <p>No spaces found matching your criteria</p>
          </div>
        ) : (
          <div className="spaces-grid">
            {filteredSpaces.map((space) => (
              <motion.div
                key={space.id}
                className="space-card"
                onClick={() => handleSpaceClick(space)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                {/* Card Header */}
                <div className="card-header">
                  <div 
                    className="card-indicator"
                    style={{ 
                      background: space.accent_color || ACCENT_COLORS[0],
                      boxShadow: `0 0 15px ${space.accent_color || ACCENT_COLORS[0]}60`
                    }}
                  ></div>
                  <div className="card-badges">
                    {space.is_owner && (
                      <span className="badge badge-owner">
                        <FaCrown /> Owner
                      </span>
                    )}
                    {space.is_collaborator && !space.is_owner && (
                      <span className="badge badge-collab">
                        <FaUsers /> Collaborator
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-content">
                  <h3 className="card-title">{space.name}</h3>
                  <p className="card-description">
                    {space.definition || 'No description'}
                  </p>

                  {/* Card Stats */}
                  <div className="card-stats">
                    <div className="stat">
                      <FaChartLine />
                      <span>{space.widgets?.length || 0} widgets</span>
                    </div>
                    {space.collaborators?.length > 0 && (
                      <div className="stat">
                        <FaUsers />
                        <span>{space.collaborators.length} collaborator{space.collaborators.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className="stat">
                      <FaCalendar />
                      <span>{new Date(space.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="card-footer">
                    <span className="space-type">{space.type || 'personal'}</span>
                    {space.privacy === 'private' && (
                      <FaLock className="privacy-icon" />
                    )}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="card-overlay">
                  <span className="overlay-text">Open Space →</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Space Modal */}
      <CreateSpaceModal
        isOpen={showCreateModal || showTemplates}
        onClose={() => {
          setShowCreateModal(false);
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

export default SpaceHome;