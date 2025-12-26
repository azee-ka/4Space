import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaUserPlus, FaUsers, FaLock, FaGlobe, 
  FaTrash, FaSpinner, FaCheck, FaBan, FaPaperPlane 
} from 'react-icons/fa';
import { ACCENT_COLORS } from '../widgetRegistry';

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
  const [collaboratorEmail, setCollaboratorEmail] = useState('');

  if (!isOpen || !space || !space.is_owner) return null;

  const handleInvite = () => {
    if (collaboratorEmail.trim()) {
      onInvite(collaboratorEmail);
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
        <motion.aside 
          className="config-panel" 
          initial={{ x: 400 }} 
          animate={{ x: 0 }} 
          exit={{ x: 400 }} 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="panel-header">
            <h2 className="panel-title">Settings</h2>
            <button className="panel-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div className="panel-content">
            {/* Name */}
            <div className="config-group">
              <label className="config-label">Name</label>
              <input 
                className="config-input" 
                value={space.name} 
                onChange={(e) => onUpdate({ name: e.target.value })} 
              />
            </div>
            
            {/* Definition */}
            <div className="config-group">
              <label className="config-label">Definition</label>
              <textarea 
                className="config-textarea" 
                value={space.definition} 
                onChange={(e) => onUpdate({ definition: e.target.value })} 
                rows={3} 
              />
            </div>

            {/* Type */}
            <div className="config-group">
              <label className="config-label">Type</label>
              <select 
                className="config-input" 
                value={space.type} 
                onChange={(e) => onUpdate({ type: e.target.value })}
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="collaborative">Collaborative</option>
                <option value="educational">Educational</option>
                <option value="creative">Creative</option>
                <option value="finance">Finance</option>
              </select>
            </div>

            {/* Color */}
            <div className="config-group">
              <label className="config-label">Color</label>
              <div className="color-grid">
                {ACCENT_COLORS.map(c => (
                  <button 
                    key={c} 
                    className={`color-option ${space.accent_color === c ? 'selected' : ''}`} 
                    style={{ background: c }} 
                    onClick={() => onUpdate({ accent_color: c })}
                  >
                    {space.accent_color === c && <span className="color-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-divider"></div>

            {/* Invite Collaborators */}
            <div className="config-group">
              <label className="config-label">
                <FaUserPlus /> Invite Collaborators
              </label>
              
              {/* Invite Status */}
              <AnimatePresence>
                {showInviteStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }} 
                    className="invite-status success"
                  >
                    <FaCheck /> Invitation sent!
                  </motion.div>
                )}
                {inviteMutation.isError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }} 
                    className="invite-status error"
                  >
                    <FaBan /> {inviteMutation.error?.response?.data?.detail || 'Failed to send invitation'}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Invite Input */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  className="config-input" 
                  placeholder="Email address" 
                  value={collaboratorEmail} 
                  onChange={(e) => setCollaboratorEmail(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleInvite()} 
                />
                <button 
                  className="header-action" 
                  onClick={handleInvite} 
                  disabled={inviteMutation.isLoading || !collaboratorEmail.trim()}
                >
                  {inviteMutation.isLoading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
                </button>
              </div>

              {/* Collaborators List */}
              <label className="config-label" style={{ marginTop: '24px' }}>
                <FaUsers /> Collaborators ({space.collaborators?.length || 0})
              </label>
              <div className="collaborators-list">
                {space.collaborators && space.collaborators.length > 0 ? (
                  space.collaborators.map(c => (
                    <div key={c.id} className="collaborator-item">
                      <div className="collab-info">
                        <span className="collab-name">{c.username}</span>
                        <span className="collab-email">{c.email}</span>
                      </div>
                      <button 
                        className="remove-collab-btn" 
                        onClick={() => window.confirm(`Remove ${c.username}?`) && onRemoveCollaborator(c.id)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-collaborators">
                    <FaUsers style={{ fontSize: '24px', opacity: 0.2, marginBottom: '8px' }} />
                    <p>No collaborators yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="config-divider"></div>

            {/* Privacy */}
            <div className="config-group">
              <label className="config-label">
                <FaLock /> Privacy
              </label>
              <div className="privacy-options">
                <button 
                  className={`privacy-btn ${space.privacy === 'private' ? 'active' : ''}`} 
                  onClick={() => onUpdate({ privacy: 'private' })}
                >
                  <FaLock /> Private
                </button>
                <button 
                  className={`privacy-btn ${space.privacy === 'team' ? 'active' : ''}`} 
                  onClick={() => onUpdate({ privacy: 'team' })}
                >
                  <FaUsers /> Team
                </button>
                <button 
                  className={`privacy-btn ${space.privacy === 'public' ? 'active' : ''}`} 
                  onClick={() => onUpdate({ privacy: 'public' })}
                >
                  <FaGlobe /> Public
                </button>
              </div>
            </div>

            <div className="config-divider"></div>

            {/* Delete */}
            <div className="config-group">
              <button 
                className="header-action danger" 
                style={{ width: '100%', justifyContent: 'center' }} 
                onClick={() => window.confirm(`Delete "${space.name}"?`) && onDelete()}
              >
                <FaTrash /> Delete Space
              </button>
            </div>
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsPanel;