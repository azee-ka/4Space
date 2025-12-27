// src/features/space/components/apps/JournalApp/JournalApp.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './journalApp.css';
import {
  FaFolder, FaFolderOpen, FaPlus, FaSearch, FaFilter,
  FaCalendarAlt, FaTag, FaStar, FaArchive, FaCog,
  FaEdit, FaTrash, FaChevronRight, FaChevronDown,
  FaHome, FaFire, FaClock, FaChartBar, FaUsers,
  FaLock, FaGlobe, FaArrowLeft, FaBars, FaTimes,
  FaEllipsisV, FaCheck, FaDownload, FaUpload
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// API functions
import {
  fetchJournalEntries, fetchJournalFolders, fetchJournalTags,
  fetchJournalStats, createJournalEntry, updateJournalEntry,
  deleteJournalEntry, createJournalFolder, updateJournalFolder,
  deleteJournalFolder, createJournalTag, deleteJournalTag,
  bulkUpdateEntries, moveEntries
} from '../../../../services/spaceApps/journalServices';
import { fetchSpaces } from '../../../../services/space';

// Components
import EntryEditor from './entryEditor';
import EntryCard from './entryCard';
import FolderTree from './folderTree';
import TagManager from './tagManager';

// Constants
const MOODS = [
  { id: 'amazing', label: 'Amazing', color: '#10b981', icon: '😄' },
  { id: 'good', label: 'Good', color: '#3b82f6', icon: '🙂' },
  { id: 'okay', label: 'Okay', color: '#f59e0b', icon: '😐' },
  { id: 'bad', label: 'Bad', color: '#ef4444', icon: '😞' },
  { id: 'terrible', label: 'Terrible', color: '#991b1b', icon: '😢' }
];

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid',
  CALENDAR: 'calendar'
};

// ============================================
// MAIN JOURNAL APP COMPONENT
// ============================================

const JournalApp = () => {
  const { spaceId, widgetId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    mood: null,
    tag: null,
    favorite: false,
    archived: false,
    author: null,
    dateFrom: null,
    dateTo: null
  });

  // Get filter from URL
  useEffect(() => {
    const folder = searchParams.get('folder');
    if (folder) {
      setSelectedFolder(folder);
    }
  }, [searchParams]);

  // ============================================
  // DATA FETCHING
  // ============================================

  // Fetch all spaces with journal widgets (for sidebar)
  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces', 'with-journal'],
    queryFn: async () => {
      const allSpaces = await fetchSpaces({ exclude_archived: 'true' });
      return allSpaces.filter(s => 
        s.widgets?.some(w => w.widget_type === 'journal')
      );
    }
  });

  // Fetch entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['journal-entries', spaceId, widgetId, selectedFolder, filters, searchQuery],
    queryFn: () => fetchJournalEntries(spaceId, widgetId, {
      folder: selectedFolder,
      search: searchQuery,
      ...filters
    }),
    enabled: !!spaceId && !!widgetId
  });

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ['journal-folders', spaceId, widgetId],
    queryFn: () => fetchJournalFolders(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['journal-tags', spaceId, widgetId],
    queryFn: () => fetchJournalTags(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['journal-stats', spaceId, widgetId],
    queryFn: () => fetchJournalStats(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const createEntryMutation = useMutation({
    mutationFn: (data) => createJournalEntry(spaceId, widgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['journal-stats']);
      setShowEditor(false);
      setSelectedEntry(null);
    }
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ entryId, data }) => updateJournalEntry(spaceId, widgetId, entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['journal-stats']);
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId) => deleteJournalEntry(spaceId, widgetId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['journal-stats']);
      setSelectedEntry(null);
      setShowEditor(false);
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: (data) => createJournalFolder(spaceId, widgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-folders']);
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (data) => bulkUpdateEntries(spaceId, widgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['journal-stats']);
      setSelectedEntries(new Set());
    }
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreateEntry = () => {
    setSelectedEntry(null);
    setShowEditor(true);
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setShowEditor(true);
  };

  const handleSaveEntry = (data) => {
    if (selectedEntry) {
      updateEntryMutation.mutate({ entryId: selectedEntry.id, data });
    } else {
      createEntryMutation.mutate(data);
    }
  };

  const handleDeleteEntry = (entryId) => {
    if (window.confirm('Delete this entry?')) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  const handleBulkAction = (action) => {
    const entryIds = Array.from(selectedEntries);
    bulkUpdateMutation.mutate({ entry_ids: entryIds, action });
  };

  const handleSelectEntry = (entryId) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map(e => e.id)));
    }
  };

  const currentSpace = spaces.find(s => s.id === spaceId);
  const currentWidget = currentSpace?.widgets?.find(w => w.id === widgetId);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="journal-app">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="journal-sidebar-nav"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="journal-sidebar-header">
              <div className="journal-logo">
                <FaHome />
                <span>Journal</span>
              </div>
              <button
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(false)}
              >
                <FaTimes />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="journal-quick-actions">
              <button className="quick-action-btn primary" onClick={handleCreateEntry}>
                <FaPlus />
                New Entry
              </button>
            </div>

            {/* Navigation */}
            <nav className="journal-nav">
              <button
                className={`journal-nav-item ${!selectedFolder && !filters.favorite && !filters.archived ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFolder(null);
                  setFilters(prev => ({ ...prev, favorite: false, archived: false }));
                  searchParams.delete('folder');
                  setSearchParams(searchParams);
                }}
              >
                <FaHome />
                <span>All Entries</span>
                <span className="nav-count">{stats?.total_entries || 0}</span>
              </button>

              <button
                className={`journal-nav-item ${filters.favorite ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFolder(null);
                  setFilters(prev => ({ ...prev, favorite: true, archived: false }));
                }}
              >
                <FaStar />
                <span>Favorites</span>
              </button>

              <button
                className={`journal-nav-item ${filters.archived ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFolder(null);
                  setFilters(prev => ({ ...prev, favorite: false, archived: true }));
                }}
              >
                <FaArchive />
                <span>Archived</span>
              </button>

              <div className="nav-divider"></div>

              <div className="nav-section-title">
                <FaFolder />
                <span>Folders</span>
                <button
                  className="nav-section-action"
                  onClick={() => {
                    const name = prompt('Folder name:');
                    if (name) {
                      createFolderMutation.mutate({ name });
                    }
                  }}
                >
                  <FaPlus />
                </button>
              </div>

              <FolderTree
                folders={folders}
                selectedFolder={selectedFolder}
                onSelectFolder={(folderId) => {
                  setSelectedFolder(folderId);
                  setFilters(prev => ({ ...prev, favorite: false, archived: false }));
                  if (folderId) {
                    searchParams.set('folder', folderId);
                  } else {
                    searchParams.delete('folder');
                  }
                  setSearchParams(searchParams);
                }}
              />

              <div className="nav-divider"></div>

              <div className="nav-section-title">
                <FaTag />
                <span>Tags</span>
                <button
                  className="nav-section-action"
                  onClick={() => setShowTagManager(true)}
                >
                  <FaCog />
                </button>
              </div>

              {tags.slice(0, 10).map(tag => (
                <button
                  key={tag.id}
                  className={`journal-nav-item tag ${filters.tag === tag.id ? 'active' : ''}`}
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      tag: prev.tag === tag.id ? null : tag.id
                    }));
                  }}
                >
                  <span className="tag-dot" style={{ background: tag.color }} />
                  <span>#{tag.name}</span>
                </button>
              ))}
            </nav>

            {/* Spaces List */}
            <div className="journal-spaces-section">
              <div className="spaces-section-title">
                Your Journal Spaces
              </div>
              {spaces.map(space => {
                const journalWidget = space.widgets?.find(w => w.widget_type === 'journal');
                const isActive = space.id === spaceId;
                
                return (
                  <button
                    key={space.id}
                    className={`space-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(`/space/${space.id}/journal/${journalWidget?.id}`)}
                  >
                    <div
                      className="space-indicator-dot"
                      style={{ background: space.accent_color }}
                    />
                    <div className="space-info">
                      <span className="space-name">{space.name}</span>
                      {space.privacy === 'private' ? (
                        <FaLock className="space-privacy-icon" />
                      ) : (
                        <FaGlobe className="space-privacy-icon" />
                      )}
                    </div>
                    {space.collaborators?.length > 0 && (
                      <FaUsers className="space-collab-icon" title={`${space.collaborators.length} collaborators`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stats Card */}
            {stats && (
              <div className="journal-sidebar-stats">
                <div className="stat-item">
                  <FaFire className="stat-icon streak" />
                  <div>
                    <div className="stat-value">{stats.current_streak}</div>
                    <div className="stat-label">Day Streak</div>
                  </div>
                </div>
                <div className="stat-item">
                  <FaClock className="stat-icon" />
                  <div>
                    <div className="stat-value">{stats.entries_this_week}</div>
                    <div className="stat-label">This Week</div>
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="journal-main">
        {/* Toolbar */}
        <div className="journal-toolbar">
          <div className="toolbar-left">
            {!sidebarOpen && (
              <button
                className="toolbar-btn"
                onClick={() => setSidebarOpen(true)}
              >
                <FaBars />
              </button>
            )}
            <button
              className="toolbar-btn"
              onClick={() => navigate(`/space/${spaceId}`)}
              title="Back to Space"
            >
              <FaArrowLeft />
            </button>
            <div className="toolbar-title">
              <h1>{currentWidget?.name || 'Journal'}</h1>
              {selectedFolder && (
                <span className="toolbar-breadcrumb">
                  <FaChevronRight />
                  {folders.find(f => f.id === selectedFolder)?.name}
                </span>
              )}
            </div>
          </div>

          <div className="toolbar-center">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="toolbar-right">
            <button
              className={`toolbar-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
            </button>
            <button className="toolbar-btn" onClick={handleCreateEntry}>
              <FaPlus />
              New Entry
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="journal-filters-bar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="filters-content">
                <div className="filter-group">
                  <label>Mood</label>
                  <div className="mood-filters">
                    <button
                      className={`mood-filter-btn ${!filters.mood ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, mood: null }))}
                    >
                      All
                    </button>
                    {MOODS.map(mood => (
                      <button
                        key={mood.id}
                        className={`mood-filter-btn ${filters.mood === mood.id ? 'active' : ''}`}
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          mood: prev.mood === mood.id ? null : mood.id
                        }))}
                        style={filters.mood === mood.id ? {
                          borderColor: mood.color,
                          background: `${mood.color}20`
                        } : {}}
                      >
                        <span className="mood-icon">{mood.icon}</span>
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <label>Date Range</label>
                  <div className="date-filters">
                    <input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>
                </div>

                <button
                  className="clear-filters-btn"
                  onClick={() => setFilters({
                    mood: null,
                    tag: null,
                    favorite: false,
                    archived: false,
                    author: null,
                    dateFrom: null,
                    dateTo: null
                  })}
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection Actions */}
        {selectedEntries.size > 0 && (
          <div className="selection-toolbar">
            <div className="selection-info">
              <FaCheck />
              <span>{selectedEntries.size} selected</span>
              <button className="select-all-btn" onClick={handleSelectAll}>
                {selectedEntries.size === entries.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="selection-actions">
              <button onClick={() => handleBulkAction('favorite')}>
                <FaStar /> Favorite
              </button>
              <button onClick={() => handleBulkAction('archive')}>
                <FaArchive /> Archive
              </button>
              <button onClick={() => handleBulkAction('delete')} className="danger">
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        )}

        {/* Entries Grid/List */}
        <div className={`journal-entries-container ${viewMode}`}>
          {entriesLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <FaCalendarAlt className="empty-icon" />
              <h3>No entries yet</h3>
              <p>Start documenting your thoughts and experiences</p>
              <button className="empty-action-btn" onClick={handleCreateEntry}>
                <FaPlus />
                Create Your First Entry
              </button>
            </div>
          ) : (
            <div className="entries-grid">
              {entries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  selected={selectedEntries.has(entry.id)}
                  onSelect={handleSelectEntry}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteEntry}
                  tags={tags}
                  moods={MOODS}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Entry Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <EntryEditor
            entry={selectedEntry}
            folders={folders}
            tags={tags}
            onSave={handleSaveEntry}
            onClose={() => {
              setShowEditor(false);
              setSelectedEntry(null);
            }}
            isSaving={createEntryMutation.isLoading || updateEntryMutation.isLoading}
          />
        )}
      </AnimatePresence>

      {/* Tag Manager Modal */}
      <AnimatePresence>
        {showTagManager && (
          <TagManager
            tags={tags}
            spaceId={spaceId}
            widgetId={widgetId}
            onClose={() => setShowTagManager(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default JournalApp;