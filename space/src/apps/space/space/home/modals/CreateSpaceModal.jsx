import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { SPACE_TEMPLATES, ACCENT_COLORS } from '../widget/widgetRegistry';

const CreateSpaceModal = ({ 
  isOpen, 
  onClose, 
  onCreate, 
  showTemplates,
  setShowTemplates,
  isLoading 
}) => {
  const [spaceName, setSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleCreate = () => {
    if (spaceName.trim()) {
      onCreate(spaceName, selectedTemplate);
      setSpaceName('');
      setSelectedTemplate(null);
    }
  };

  const handleBack = () => {
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  if (!isOpen) return null;

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
          className="create-space-modal" 
          initial={{ scale: 0.9 }} 
          animate={{ scale: 1 }} 
          exit={{ scale: 0.9 }} 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {showTemplates && (
                <button 
                  className="nav-icon-btn"
                  onClick={handleBack}
                  style={{ marginRight: '8px' }}
                >
                  <FaArrowLeft />
                </button>
              )}
              <div>
                <h2 className="modal-title">
                  {showTemplates ? 'Choose a Template' : 'Create New Space'}
                </h2>
                <p className="modal-subtitle">
                  {showTemplates 
                    ? 'Start with a pre-configured space or build from scratch'
                    : 'Give your space a name to get started'
                  }
                </p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          {showTemplates ? (
            <div className="templates-grid">
              {SPACE_TEMPLATES.map(template => {
                const Icon = template.icon;
                const isSelected = selectedTemplate === template.id;
                
                return (
                  <motion.div
                    key={template.id}
                    className={`template-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template.id)}
                    whileHover={{ y: -2 }}
                    style={isSelected ? { borderColor: template.accentColor } : {}}
                  >
                    <div 
                      className="template-icon"
                      style={isSelected ? { color: template.accentColor } : {}}
                    >
                      {Icon && <Icon />}
                    </div>
                    <h4>{template.name}</h4>
                    <p>{template.definition}</p>
                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span className="template-badge">{template.type}</span>
                      {template.widgets && template.widgets.length > 0 && (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                          {template.widgets.length} widgets included
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '24px',
                          height: '24px',
                          background: template.accentColor,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000'
                        }}
                      >
                        <FaCheck style={{ fontSize: '12px' }} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '40px 24px' }}>
              <div className="config-group">
                <label className="config-label">Space Name</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="My Awesome Space"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && spaceName.trim()) {
                      setShowTemplates(true);
                    }
                  }}
                  autoFocus
                />
              </div>
              
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                  Next, you'll choose a template or start from scratch
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="modal-footer">
            <div className="modal-actions">
              <button 
                className="modal-btn cancel" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              {showTemplates ? (
                <button 
                  className="modal-btn create" 
                  onClick={handleCreate}
                  disabled={isLoading || !spaceName.trim()}
                >
                  {isLoading ? 'Creating...' : `Create ${selectedTemplate ? 'from Template' : 'Blank Space'}`}
                </button>
              ) : (
                <button 
                  className="modal-btn create" 
                  onClick={() => spaceName.trim() && setShowTemplates(true)}
                  disabled={!spaceName.trim()}
                >
                  Next: Choose Template
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateSpaceModal;