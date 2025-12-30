// src/features/space/components/apps/JournalApp/TagManager.jsx

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { FaTimes, FaPlus, FaTrash, FaTag } from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJournalTag, deleteJournalTag } from '../../../../../services/spaceApps/journalServices';

const TAG_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#84cc16'
];

const TagManager = ({ tags, spaceId, widgetId, onClose }) => {
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  const createTagMutation = useMutation({
    mutationFn: (data) => createJournalTag(spaceId, widgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-tags']);
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0]);
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId) => deleteJournalTag(spaceId, widgetId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-tags']);
    }
  });

  const handleCreateTag = (e) => {
    e.preventDefault();
    if (newTagName.trim()) {
      createTagMutation.mutate({
        name: newTagName.trim(),
        color: newTagColor
      });
    }
  };

  const handleDeleteTag = (tagId) => {
    if (window.confirm('Delete this tag? It will be removed from all entries.')) {
      deleteTagMutation.mutate(tagId);
    }
  };

  const modalContent = (
    <motion.div
      className="tag-manager-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="tag-manager-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="tag-manager-header">
          <h2>
            <FaTag /> Manage Tags
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Create Tag Form */}
        <form className="tag-create-form" onSubmit={handleCreateTag}>
          <input
            type="text"
            placeholder="Tag name..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            maxLength={50}
          />
          
          <div className="color-picker">
            {TAG_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`color-option ${newTagColor === color ? 'selected' : ''}`}
                style={{ background: color }}
                onClick={() => setNewTagColor(color)}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!newTagName.trim() || createTagMutation.isLoading}
          >
            <FaPlus /> Create Tag
          </button>
        </form>

        {/* Tags List */}
        <div className="tags-list">
          {tags.length === 0 ? (
            <div className="tags-empty">
              <p>No tags yet. Create your first tag above.</p>
            </div>
          ) : (
            tags.map(tag => (
              <div key={tag.id} className="tag-item">
                <span
                  className="tag-color-dot"
                  style={{ background: tag.color }}
                />
                <span className="tag-name">#{tag.name}</span>
                <button
                  className="tag-delete-btn"
                  onClick={() => handleDeleteTag(tag.id)}
                  disabled={deleteTagMutation.isLoading}
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default TagManager;