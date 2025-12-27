// src/features/space/components/apps/JournalApp/EntryCard.jsx

import React, { useState } from 'react';
import { FaStar, FaEdit, FaTrash, FaCheck, FaLock, FaEllipsisV } from 'react-icons/fa';
import { motion } from 'framer-motion';

const EntryCard = ({ entry, selected, onSelect, onEdit, onDelete, tags, moods }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const mood = moods.find(m => m.id === entry.mood);
  const entryTags = entry.tags?.map(tagId => tags.find(t => t.id === tagId)).filter(Boolean) || [];

  // Use backend-provided excerpt or generate from content with null check
  const excerpt = entry.excerpt || (entry.content ? 
    entry.content.replace(/<[^>]*>/g, '').substring(0, 150) + (entry.content.length > 150 ? '...' : '') 
    : 'No content');

  return (
    <motion.div
      className={`entry-card ${selected ? 'selected' : ''} ${entry.is_pinned ? 'pinned' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onEdit(entry)}
    >
      {/* Selection Checkbox */}
      <div
        className="entry-checkbox"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(entry.id);
        }}
      >
        <div className={`checkbox-box ${selected ? 'checked' : ''}`}>
          {selected && <FaCheck />}
        </div>
      </div>

      {/* Header */}
      <div className="entry-card-header">
        <div className="entry-meta">
          <span className="entry-date">
            {new Date(entry.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          {entry.is_private && (
            <span className="entry-private-badge" title="Private">
              <FaLock />
            </span>
          )}
          {mood && (
            <span
              className="entry-mood-badge"
              style={{
                background: `${mood.color}30`,
                borderColor: mood.color,
                color: mood.color
              }}
            >
              {mood.icon} {mood.label}
            </span>
          )}
        </div>

        <div className="entry-actions">
          {entry.is_favorite && (
            <FaStar className="entry-favorite-icon" />
          )}
          <button
            className="entry-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <FaEllipsisV />
          </button>

          {showMenu && (
            <div className="entry-menu">
              <button onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
                setShowMenu(false);
              }}>
                <FaEdit /> Edit
              </button>
              <button onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
                setShowMenu(false);
              }} className="danger">
                <FaTrash /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="entry-title">{entry.title || 'Untitled Entry'}</h3>

      {/* Excerpt */}
      <p className="entry-excerpt">{excerpt}</p>

      {/* Footer */}
      <div className="entry-card-footer">
        <div className="entry-tags">
          {entryTags.slice(0, 3).map(tag => (
            <span
              key={tag.id}
              className="entry-tag"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              #{tag.name}
            </span>
          ))}
          {entryTags.length > 3 && (
            <span className="entry-tag-more">+{entryTags.length - 3}</span>
          )}
        </div>

        <div className="entry-stats">
          {entry.word_count && (
            <span className="entry-stat">{entry.word_count} words</span>
          )}
          {entry.attachments_count > 0 && (
            <span className="entry-stat">📎 {entry.attachments_count}</span>
          )}
          {entry.comments_count > 0 && (
            <span className="entry-stat">💬 {entry.comments_count}</span>
          )}
        </div>
      </div>

      {/* Author (for shared spaces) */}
      {entry.author && entry.author.username && (
        <div className="entry-author">
          by {entry.author.username}
        </div>
      )}
    </motion.div>
  );
};

export default EntryCard;