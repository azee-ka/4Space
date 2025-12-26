import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { SPACE_TEMPLATES } from '../widgetRegistry';

const CreateSpaceModal = ({ 
  isOpen, 
  onClose, 
  onCreate,
  showTemplates,
  setShowTemplates,
  isLoading 
}) => {
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleCreate = () => {
    if (!newSpaceName.trim()) return;
    onCreate(newSpaceName, selectedTemplate);
  };

  const handleClose = () => {
    setNewSpaceName('');
    setSelectedTemplate(null);
    setShowTemplates(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="overlay" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={handleClose}
      >
        <motion.div 
          className="create-space-modal" 
          initial={{ scale: 0.9 }} 
          animate={{ scale: 1 }} 
          exit={{ scale: 0.9 }} 
          onClick={(e) => e.stopPropagation()}
        >
          {showTemplates ? (
            <>
              {/* Template Selection */}
              <div className="modal-header">
                <h2>Choose Template</h2>
                <button className="close-btn" onClick={handleClose}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="templates-grid">
                {SPACE_TEMPLATES.map(t => {
                  const Icon = t.icon;
                  return (
                    <div 
                      key={t.id} 
                      className={`template-card ${selectedTemplate === t.id ? 'selected' : ''}`} 
                      onClick={() => setSelectedTemplate(t.id)} 
                      style={selectedTemplate === t.id ? { borderColor: t.accentColor } : {}}
                    >
                      <div className="template-icon" style={{ color: t.accentColor }}>
                        <Icon />
                      </div>
                      <h4>{t.name}</h4>
                      <p>{t.description}</p>
                      <div className="template-badge">{t.widgets.length} widgets</div>
                    </div>
                  );
                })}
              </div>
              
              {selectedTemplate && (
                <div className="modal-footer">
                  <input 
                    className="modal-input" 
                    placeholder="Space name..." 
                    value={newSpaceName} 
                    onChange={(e) => setNewSpaceName(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleCreate()} 
                    autoFocus 
                  />
                  <div className="modal-actions">
                    <button className="modal-btn cancel" onClick={handleClose}>
                      Cancel
                    </button>
                    <button 
                      className="modal-btn create" 
                      onClick={handleCreate} 
                      disabled={isLoading || !newSpaceName.trim()}
                    >
                      {isLoading ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Simple Create */}
              <h3 className="modal-title">Create Space</h3>
              <p className="modal-subtitle">Name your space</p>
              <input 
                className="modal-input" 
                placeholder="e.g., Work, Study..." 
                value={newSpaceName} 
                onChange={(e) => setNewSpaceName(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()} 
                autoFocus 
              />
              <div className="modal-actions">
                <button className="modal-btn cancel" onClick={handleClose}>
                  Cancel
                </button>
                <button 
                  className="modal-btn create" 
                  onClick={handleCreate} 
                  disabled={isLoading || !newSpaceName.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateSpaceModal;