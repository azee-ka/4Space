// src/features/space/components/apps/JournalApp/JournalApp.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './JournalApp.css';
import {
  FaFolder, FaPlus, FaSearch, FaFilter, FaCalendarAlt,
  FaTag, FaStar, FaArchive, FaCog, FaTrash, FaChevronRight,
  FaHome, FaFire, FaClock, FaUsers, FaLock, FaGlobe,
  FaArrowLeft, FaBars, FaTimes, FaCheck, FaSmile, FaMeh,
  FaFrown, FaGrin, FaSadTear, FaSave, FaFileAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// API functions
import {
  fetchJournalEntries, fetchJournalFolders, fetchJournalTags,
  fetchJournalStats, fetchJournalEntry, createJournalEntry, 
  updateJournalEntry, deleteJournalEntry, createJournalFolder, 
  bulkUpdateEntries
} from '../../../../../services/spaceApps/journalServices';
import { fetchSpaces } from '../../../../../services/space';

// Components
import FolderTree from './FolderTree';
import TagManager from './TagManager';

// Constants
const MOODS = [
  { id: 'amazing', label: 'Amazing', color: '#10b981', Icon: FaGrin },
  { id: 'good', label: 'Good', color: '#3b82f6', Icon: FaSmile },
  { id: 'okay', label: 'Okay', color: '#f59e0b', Icon: FaMeh },
  { id: 'bad', label: 'Bad', color: '#ef4444', Icon: FaFrown },
  { id: 'terrible', label: 'Terrible', color: '#991b1b', Icon: FaSadTear }
];

// Auto-save hook with debouncing
const useAutoSave = (callback, delay = 2000) => {
  const timeoutRef = useRef(null);
  
  const debouncedSave = useCallback((data) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(data);
    }, delay);
  }, [callback, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedSave;
};

// ============================================
// MAIN JOURNAL APP COMPONENT
// ============================================

const JournalApp = () => {
  const { spaceId, widgetId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Track if data is from user edit or programmatic load
  const isUserEditRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);

  // Editor State
  const [entryData, setEntryData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    mood: null,
    folder_id: null,
    tag_ids: [],
    is_private: false,
    is_favorite: false
  });

  // Filters
  const [filters, setFilters] = useState({
    mood: null,
    tag: null,
    favorite: false,
    archived: false,
    dateFrom: null,
    dateTo: null
  });

  // Get filter from URL
  useEffect(() => {
    const folder = searchParams.get('folder');
    if (folder) setSelectedFolder(folder);
  }, [searchParams]);

  // Load entry data when selection changes
  useEffect(() => {
    if (selectedEntry) {
      isUserEditRef.current = false; // Reset flag - this is a load, not user edit
      setEntryData({
        title: selectedEntry.title || '',
        content: selectedEntry.content || '',
        date: selectedEntry.date || new Date().toISOString().split('T')[0],
        mood: selectedEntry.mood || null,
        folder_id: selectedEntry.folder?.id || null,
        tag_ids: selectedEntry.tags?.map(t => t.id) || [],
        is_private: selectedEntry.is_private || false,
        is_favorite: selectedEntry.is_favorite || false
      });
    } else {
      // Clear data when no entry selected
      isUserEditRef.current = false;
      setEntryData({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        mood: null,
        folder_id: null,
        tag_ids: [],
        is_private: false,
        is_favorite: false
      });
    }
  }, [selectedEntry]);

  // ============================================
  // DATA FETCHING
  // ============================================

  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces', 'with-journal'],
    queryFn: async () => {
      const allSpaces = await fetchSpaces({ exclude_archived: 'true' });
      return allSpaces.filter(s => 
        s.widgets?.some(w => w.widget_type === 'journal')
      );
    }
  });

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['journal-entries', spaceId, widgetId, selectedFolder, filters, searchQuery],
    queryFn: () => fetchJournalEntries(spaceId, widgetId, {
      folder: selectedFolder,
      search: searchQuery,
      archived: false,
      ...filters
    }),
    enabled: !!spaceId && !!widgetId
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['journal-folders', spaceId, widgetId],
    queryFn: () => fetchJournalFolders(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['journal-tags', spaceId, widgetId],
    queryFn: () => fetchJournalTags(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

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
    onSuccess: (newEntry) => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['journal-stats']);
      setSelectedEntry(newEntry);
      setLastSaved(new Date());
      setIsSaving(false);
    }
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ entryId, data }) => updateJournalEntry(spaceId, widgetId, entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['journal-stats']);
      setLastSaved(new Date());
      setIsSaving(false);
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId) => deleteJournalEntry(spaceId, widgetId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['journal-stats']);
      setSelectedEntry(null);
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
  // AUTO-SAVE LOGIC
  // ============================================

  const performSave = useCallback((data) => {
    if (!data.title && !data.content) return; // Don't save empty entries
    
    setIsSaving(true);
    
    // Clean data for API
    const cleanData = {
      title: data.title || '',
      content: data.content || '',
      date: data.date,
      mood: data.mood || null,
      folder_id: data.folder_id || null,
      tag_ids: data.tag_ids || [],
      is_private: data.is_private,
      is_favorite: data.is_favorite
    };
    
    if (selectedEntry) {
      updateEntryMutation.mutate({ entryId: selectedEntry.id, data: cleanData });
    } else {
      createEntryMutation.mutate(cleanData);
    }
  }, [selectedEntry, updateEntryMutation, createEntryMutation]);

  const autoSave = useAutoSave(performSave, 2000);

  // Trigger auto-save when entry data changes (but ONLY on user edits)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    
    // Only auto-save if this was a user edit (not a programmatic load)
    if (isUserEditRef.current && !isLoadingEntry && selectedEntry && (entryData.title || entryData.content)) {
      autoSave(entryData);
    }
  }, [entryData.title, entryData.content, entryData.mood, entryData.folder_id, 
      entryData.tag_ids, entryData.is_private, entryData.is_favorite, entryData.date, 
      isLoadingEntry, selectedEntry]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreateEntry = () => {
    // Immediately create entry on backend
    const newEntryData = {
      title: 'Untitled Entry',
      content: '',
      date: new Date().toISOString().split('T')[0],
      mood: null,
      folder_id: selectedFolder,
      tag_ids: [],
      is_private: false,
      is_favorite: false
    };
    
    createEntryMutation.mutate(newEntryData);
  };

  const handleSelectEntry = (entry) => {
    if (selectedEntries.size > 0) {
      // Multi-select mode
      const newSelected = new Set(selectedEntries);
      if (newSelected.has(entry.id)) {
        newSelected.delete(entry.id);
      } else {
        newSelected.add(entry.id);
      }
      setSelectedEntries(newSelected);
    } else {
      // Fetch full entry details (list only has excerpt, not content)
      setIsLoadingEntry(true);
      fetchJournalEntry(spaceId, widgetId, entry.id)
        .then(fullEntry => {
          setSelectedEntry(fullEntry);
          setIsLoadingEntry(false);
        })
        .catch(err => {
          console.error('Failed to fetch entry:', err);
          setIsLoadingEntry(false);
        });
    }
  };

  const handleDeleteEntry = () => {
    if (selectedEntry && window.confirm('Delete this entry?')) {
      deleteEntryMutation.mutate(selectedEntry.id);
    }
  };

  const handleBulkAction = (action) => {
    const entryIds = Array.from(selectedEntries);
    bulkUpdateMutation.mutate({ entry_ids: entryIds, action });
  };

  const handleSelectAll = () => {
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map(e => e.id)));
    }
  };

  const handleTagToggle = (tagId) => {
    isUserEditRef.current = true;
    setEntryData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  const currentSpace = spaces.find(s => s.id === spaceId);
  const currentWidget = currentSpace?.widgets?.find(w => w.id === widgetId);

  // Quill modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="journal-app">
      {/* Left Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="journal-sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
          >
            <div className="journal-sidebar-header">
              <div className="journal-logo">
                <FaHome />
                <span>Journal</span>
              </div>
              <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="journal-quick-actions">
              <button className="quick-action-btn" onClick={handleCreateEntry}>
                <FaPlus />
                New Entry
              </button>
            </div>

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
                    if (name) createFolderMutation.mutate({ name });
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
                <button className="nav-section-action" onClick={() => setShowTagManager(true)}>
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

            <div className="journal-spaces-section">
              <div className="spaces-section-title">Your Journal Spaces</div>
              {spaces.map(space => {
                const journalWidget = space.widgets?.find(w => w.widget_type === 'journal');
                const isActive = space.id === spaceId;
                
                return (
                  <button
                    key={space.id}
                    className={`space-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(`/space/${space.id}/journal/${journalWidget?.id}`)}
                  >
                    <div className="space-indicator-dot" style={{ background: space.accent_color }} />
                    <div className="space-info">
                      <span className="space-name">{space.name}</span>
                      {space.privacy === 'private' ? <FaLock className="space-privacy-icon" /> : <FaGlobe className="space-privacy-icon" />}
                    </div>
                    {space.collaborators?.length > 0 && (
                      <FaUsers className="space-collab-icon" title={`${space.collaborators.length} collaborators`} />
                    )}
                  </button>
                );
              })}
            </div>

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

      {/* Middle Panel - Entry List */}
      <div className="journal-entry-list">
        <div className="entry-list-header">
          {!sidebarOpen && (
            <button className="toolbar-btn" onClick={() => setSidebarOpen(true)}>
              <FaBars />
            </button>
          )}
          <h2>{currentWidget?.name || 'Journal'}</h2>
          {selectedFolder && (
            <span className="breadcrumb">
              <FaChevronRight />
              {folders.find(f => f.id === selectedFolder)?.name}
            </span>
          )}
        </div>

        <div className="entry-list-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="entry-list-filters">
          <button
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
          </button>
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="filter-section">
              <label>Mood</label>
              <div className="mood-filter-grid">
                {MOODS.map(mood => {
                  const MoodIcon = mood.Icon;
                  return (
                    <button
                      key={mood.id}
                      className={`mood-filter-btn ${filters.mood === mood.id ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        mood: prev.mood === mood.id ? null : mood.id
                      }))}
                      style={filters.mood === mood.id ? { borderColor: mood.color, color: mood.color } : {}}
                    >
                      <MoodIcon />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedEntries.size > 0 && (
          <div className="selection-bar">
            <span>{selectedEntries.size} selected</span>
            <div className="selection-actions">
              <button onClick={handleSelectAll}>
                {selectedEntries.size === entries.length ? 'Deselect' : 'Select All'}
              </button>
              <button onClick={() => handleBulkAction('favorite')}><FaStar /></button>
              <button onClick={() => handleBulkAction('archive')}><FaArchive /></button>
              <button onClick={() => handleBulkAction('delete')} className="danger"><FaTrash /></button>
            </div>
          </div>
        )}

        <div className="entry-list-items">
          {entriesLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <FaFileAlt />
              <p>No entries yet</p>
              <button onClick={handleCreateEntry}>Create Entry</button>
            </div>
          ) : (
            entries.map(entry => {
              const mood = MOODS.find(m => m.id === entry.mood);
              const MoodIcon = mood?.Icon;
              const isSelected = selectedEntry?.id === entry.id;
              const isChecked = selectedEntries.has(entry.id);
              
              return (
                <div
                  key={entry.id}
                  className={`entry-list-item ${isSelected ? 'active' : ''} ${isChecked ? 'checked' : ''}`}
                  onClick={() => handleSelectEntry(entry)}
                >
                  {selectedEntries.size > 0 && (
                    <div className="entry-checkbox">
                      <div className={`checkbox ${isChecked ? 'checked' : ''}`}>
                        {isChecked && <FaCheck />}
                      </div>
                    </div>
                  )}
                  <div className="entry-list-item-content">
                    <div className="entry-list-item-header">
                      <h4>{entry.title || 'Untitled'}</h4>
                      <div className="entry-indicators">
                        {mood && <MoodIcon style={{ color: mood.color }} />}
                        {entry.is_favorite && <FaStar className="indicator-favorite" />}
                      </div>
                    </div>
                    <p className="entry-list-item-excerpt">
                      {entry.excerpt || 'No content'}
                    </p>
                    <div className="entry-list-item-meta">
                      <span className="entry-meta-chip">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {entry.word_count > 0 && (
                        <span className="entry-meta-chip">{entry.word_count}w</span>
                      )}
                      {entry.folder && (
                        <span className="entry-meta-chip">
                          <FaFolder style={{ color: entry.folder.color }} />
                          {entry.folder.name}
                        </span>
                      )}
                      {entry.tags?.slice(0, 2).map(tag => (
                        <span
                          key={tag.id}
                          className="entry-meta-chip tag"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          #{tag.name}
                        </span>
                      ))}
                      {entry.tags && entry.tags.length > 2 && (
                        <span className="entry-meta-chip">+{entry.tags.length - 2}</span>
                      )}
                      {entry.author?.username && (
                        <span className="entry-meta-chip author">
                          <FaUsers />
                          {entry.author.username}
                        </span>
                      )}
                      {entry.is_private ? (
                        <span className="entry-meta-chip private">
                          <FaLock />
                        </span>
                      ) : (
                        <span className="entry-meta-chip shared">
                          <FaGlobe />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Embedded Editor */}
      <div className="journal-editor-panel">
        {isLoadingEntry ? (
          <div className="editor-empty-state">
            <div className="spinner" />
            <p>Loading entry...</p>
          </div>
        ) : selectedEntry ? (
          <>
            {/* Note: React Quill warning about findDOMNode is a known library issue, safe to ignore */}
            {/* Single Row Top Bar - ALL metadata */}
            <div className="editor-toolbar">
              <div className="editor-toolbar-left">
                <button onClick={() => setSelectedEntry(null)} title="Back to list">
                  <FaArrowLeft />
                </button>
                <button onClick={handleDeleteEntry} className="danger" title="Delete">
                  <FaTrash />
                </button>
              </div>
              <div className="editor-toolbar-center">
                <input
                  type="date"
                  value={entryData.date}
                  onChange={(e) => {
                    isUserEditRef.current = true;
                    setEntryData(prev => ({ ...prev, date: e.target.value }));
                  }}
                  className="metadata-date"
                />
                <select
                  value={entryData.mood || ''}
                  onChange={(e) => {
                    isUserEditRef.current = true;
                    setEntryData(prev => ({ ...prev, mood: e.target.value || null }));
                  }}
                  className="metadata-mood"
                >
                  <option value="">Mood</option>
                  {MOODS.map(mood => (
                    <option key={mood.id} value={mood.id}>{mood.label}</option>
                  ))}
                </select>
                <select
                  value={entryData.folder_id || ''}
                  onChange={(e) => {
                    isUserEditRef.current = true;
                    setEntryData(prev => ({ ...prev, folder_id: e.target.value || null }));
                  }}
                  className="metadata-folder"
                >
                  <option value="">Folder</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
                <div className="save-status">
                  {isSaving ? (
                    <><FaSave className="saving" /> Saving...</>
                  ) : lastSaved ? (
                    <><FaCheck className="saved" /> Saved</>
                  ) : null}
                </div>
              </div>
              <div className="editor-toolbar-right">
                <button
                  className={`toolbar-icon ${entryData.is_favorite ? 'active' : ''}`}
                  onClick={() => {
                    isUserEditRef.current = true;
                    setEntryData(prev => ({ ...prev, is_favorite: !prev.is_favorite }));
                  }}
                  title="Favorite"
                >
                  <FaStar />
                </button>
                <button
                  className={`toolbar-icon ${entryData.is_private ? 'active' : ''}`}
                  onClick={() => {
                    isUserEditRef.current = true;
                    setEntryData(prev => ({ ...prev, is_private: !prev.is_private }));
                  }}
                  title={entryData.is_private ? 'Private' : 'Shared'}
                >
                  {entryData.is_private ? <FaLock /> : <FaGlobe />}
                </button>
              </div>
            </div>

            {/* Title - Full Width */}
            <input
              type="text"
              className="editor-title-compact"
              placeholder="Untitled"
              value={entryData.title}
              onChange={(e) => {
                isUserEditRef.current = true;
                setEntryData(prev => ({ ...prev, title: e.target.value }));
              }}
            />

            {/* Content - Native, No Container */}
            <div className="editor-content">
              <ReactQuill
                theme="snow"
                value={entryData.content}
                onChange={(content) => {
                  isUserEditRef.current = true;
                  setEntryData(prev => ({ ...prev, content }));
                }}
                modules={quillModules}
                placeholder="Start writing..."
              />
            </div>

            {/* Tags Footer */}
            <div className="editor-tags-compact">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  className={`tag-chip ${entryData.tag_ids.includes(tag.id) ? 'active' : ''}`}
                  onClick={() => handleTagToggle(tag.id)}
                  style={entryData.tag_ids.includes(tag.id) ? {
                    borderColor: tag.color,
                    background: `${tag.color}15`,
                    color: tag.color
                  } : {}}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="editor-empty-state">
            <FaFileAlt />
            <h3>No entry selected</h3>
            <p>Select an entry from the list or create a new one</p>
            <button onClick={handleCreateEntry}>
              <FaPlus /> New Entry
            </button>
          </div>
        )}
      </div>

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