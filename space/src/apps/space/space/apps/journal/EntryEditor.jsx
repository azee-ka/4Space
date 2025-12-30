// src/features/space/components/apps/JournalApp/EntryEditor.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import {
  FaTimes, FaSave, FaFolder, FaTag, FaStar, FaLock,
  FaGlobe, FaSmile, FaCalendarAlt, FaBold, FaItalic,
  FaUnderline, FaListUl, FaListOl, FaQuoteRight
} from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MOODS = [
  { id: 'amazing', label: 'Amazing', color: '#10b981', icon: '😄' },
  { id: 'good', label: 'Good', color: '#3b82f6', icon: '🙂' },
  { id: 'okay', label: 'Okay', color: '#f59e0b', icon: '😐' },
  { id: 'bad', label: 'Bad', color: '#ef4444', icon: '😞' },
  { id: 'terrible', label: 'Terrible', color: '#991b1b', icon: '😢' }
];

const EntryEditor = ({ entry, folders, tags, onSave, onClose, isSaving }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    mood: null,
    folder_id: null,
    tag_ids: [],
    is_private: false,
    is_favorite: false,
    is_pinned: false
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || '',
        content: entry.content || '',
        date: entry.date || new Date().toISOString().split('T')[0],
        mood: entry.mood || null,
        folder_id: entry.folder?.id || null,
        tag_ids: entry.tags?.map(t => t.id) || [],
        is_private: entry.is_private || false,
        is_favorite: entry.is_favorite || false,
        is_pinned: entry.is_pinned || false
      });
    }
  }, [entry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  // Quill modules configuration
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

  const modalContent = (
    <motion.div
      className="entry-editor-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="entry-editor-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="entry-editor-header">
          <h2>{entry ? 'Edit Entry' : 'New Entry'}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form className="entry-editor-form" onSubmit={handleSubmit}>
          {/* Metadata Bar */}
          <div className="entry-metadata-bar">
            <div className="metadata-left">
              <div className="metadata-field">
                <FaCalendarAlt />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="metadata-field mood-selector">
                <FaSmile />
                <select
                  value={formData.mood || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value || null }))}
                >
                  <option value="">Select mood</option>
                  {MOODS.map(mood => (
                    <option key={mood.id} value={mood.id}>
                      {mood.icon} {mood.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="metadata-field folder-selector">
                <FaFolder />
                <select
                  value={formData.folder_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, folder_id: e.target.value || null }))}
                >
                  <option value="">No folder</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="metadata-right">
              <button
                type="button"
                className={`metadata-toggle ${formData.is_private ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, is_private: !prev.is_private }))}
                title={formData.is_private ? 'Private' : 'Shared'}
              >
                {formData.is_private ? <FaLock /> : <FaGlobe />}
              </button>

              <button
                type="button"
                className={`metadata-toggle ${formData.is_favorite ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, is_favorite: !prev.is_favorite }))}
                title="Favorite"
              >
                <FaStar />
              </button>
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            className="entry-title-input"
            placeholder="Entry title..."
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            autoFocus
          />

          {/* Rich Text Editor */}
          <div className="entry-content-editor">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              modules={quillModules}
              placeholder="Start writing..."
            />
          </div>

          {/* Tags */}
          <div className="entry-tags-section">
            <label>
              <FaTag /> Tags
            </label>
            <div className="tags-selector">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-option ${formData.tag_ids.includes(tag.id) ? 'selected' : ''}`}
                  onClick={() => handleTagToggle(tag.id)}
                  style={formData.tag_ids.includes(tag.id) ? {
                    borderColor: tag.color,
                    background: `${tag.color}20`,
                    color: tag.color
                  } : {}}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="entry-editor-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="btn-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  {entry ? 'Update' : 'Create'} Entry
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default EntryEditor;