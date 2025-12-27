import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaTrash, FaUserPlus, FaCheck, FaLock, FaGlobe, FaUsers 
} from 'react-icons/fa';
import { ACCENT_COLORS } from '../widget/widgetRegistry';

const SettingsPanel = ({ 
  isOpen, 
  onClose, 
  space, 
  onUpdate, 
  onDelete,
  onInvite,
  onRemoveCollaborator,
  inviteMutation,
  updateMutation,
  showInviteStatus,
  setShowInviteStatus
}) => {
  const [spaceName, setSpaceName] = useState('');
  const [spaceDefinition, setSpaceDefinition] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCENT_COLORS[0]);
  const [privacy, setPrivacy] = useState('private');
  const [inviteEmail, setInviteEmail] = useState('');

  // Pre-fill fields when space changes
  useEffect(() => {
    if (space) {
      setSpaceName(space.name || '');
      setSpaceDefinition(space.definition || '');
      setSelectedColor(space.accent_color || ACCENT_COLORS[0]);
      setPrivacy(space.privacy || 'private');
    }
  }, [space]);

  if (!isOpen || !space) return null;

  const handleUpdate = () => {
    onUpdate({
      name: spaceName,
      definition: spaceDefinition,
      accent_color: selectedColor,
      privacy
    });
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      onInvite(inviteEmail);
      setInviteEmail('');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${space.name}"? This cannot be undone.`)) {
      onDelete();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="config-panel"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ 
            type: 'spring',
            damping: 20,
            stiffness: 300,
            bounce: 0.4
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="panel-header">
            <h3 className="panel-title">Space Settings</h3>
            <button className="panel-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div className="panel-content">
            {/* Invite Status */}
            {showInviteStatus && (
              <motion.div 
                className={`invite-status ${inviteMutation.isError ? 'error' : 'success'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <FaCheck />
                <span>
                  {inviteMutation.isError 
                    ? 'Failed to send invite' 
                    : 'Invite sent successfully!'}
                </span>
              </motion.div>
            )}

            {/* Basic Info */}
            <div className="config-group">
              <label className="config-label">
                Space Name
              </label>
              <input
                type="text"
                className="config-input"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                onBlur={handleUpdate}
                placeholder="My Space"
              />
            </div>

            <div className="config-group">
              <label className="config-label">
                Description
              </label>
              <textarea
                className="config-textarea"
                rows={3}
                value={spaceDefinition}
                onChange={(e) => setSpaceDefinition(e.target.value)}
                onBlur={handleUpdate}
                placeholder="Describe your space..."
              />
            </div>

            {/* Accent Color */}
            <div className="config-group">
              <label className="config-label">
                Accent Color
              </label>
              <div className="color-grid">
                {ACCENT_COLORS.map(color => (
                  <motion.button
                    key={color}
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      onUpdate({ accent_color: color });
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {selectedColor === color && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <FaCheck className="color-check" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className="config-group">
              <label className="config-label">
                Privacy
              </label>
              <div className="privacy-options">
                <button
                  className={`privacy-btn ${privacy === 'private' ? 'active' : ''}`}
                  onClick={() => {
                    setPrivacy('private');
                    onUpdate({ privacy: 'private' });
                  }}
                >
                  <FaLock /> Private
                </button>
                <button
                  className={`privacy-btn ${privacy === 'shared' ? 'active' : ''}`}
                  onClick={() => {
                    setPrivacy('shared');
                    onUpdate({ privacy: 'shared' });
                  }}
                >
                  <FaUsers /> Shared
                </button>
                <button
                  className={`privacy-btn ${privacy === 'public' ? 'active' : ''}`}
                  onClick={() => {
                    setPrivacy('public');
                    onUpdate({ privacy: 'public' });
                  }}
                >
                  <FaGlobe /> Public
                </button>
              </div>
            </div>

            <div className="config-divider"></div>

            {/* Collaborators */}
            {space.is_owner && (
              <>
                <div className="config-group">
                  <label className="config-label">
                    <FaUserPlus /> Invite Collaborators
                  </label>
                  <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      className="config-input"
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="submit"
                      className="header-action"
                      disabled={inviteMutation.isLoading || !inviteEmail.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {inviteMutation.isLoading ? 'Sending...' : 'Invite'}
                    </button>
                  </form>
                </div>

                {space.collaborators && space.collaborators.length > 0 && (
                  <div className="config-group">
                    <label className="config-label">
                      Current Collaborators ({space.collaborators.length})
                    </label>
                    <div className="collaborators-list">
                      {space.collaborators.map((collab, index) => (
                        <motion.div 
                          key={collab.id} 
                          className="collaborator-item"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="collab-info">
                            <span className="collab-name">
                              {collab.first_name} {collab.last_name}
                            </span>
                            <span className="collab-email">{collab.email}</span>
                          </div>
                          <button
                            className="remove-collab-btn"
                            onClick={() => onRemoveCollaborator(collab.id)}
                            title="Remove collaborator"
                          >
                            <FaTimes />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {(!space.collaborators || space.collaborators.length === 0) && (
                  <div className="empty-collaborators">
                    <p>No collaborators yet. Invite someone to get started!</p>
                  </div>
                )}

                <div className="config-divider"></div>
              </>
            )}

            {/* Danger Zone */}
            {space.is_owner && (
              <div className="config-group">
                <label className="config-label" style={{ color: '#ff006e' }}>
                  <FaTrash /> Danger Zone
                </label>
                <button
                  className="header-action danger"
                  onClick={handleDelete}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <FaTrash /> Delete Space
                </button>
                <p style={{ 
                  fontSize: '12px', 
                  color: 'rgba(255,255,255,0.4)', 
                  marginTop: '8px' 
                }}>
                  This action cannot be undone. All widgets and data will be permanently deleted.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsPanel;