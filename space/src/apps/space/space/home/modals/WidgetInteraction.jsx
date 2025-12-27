import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaExpand, FaCompress, FaGripVertical, FaExternalLinkAlt
} from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWidgetConfig } from '../../../../../services/space';
import { WIDGET_REGISTRY } from '../widget/widgetRegistry';

// Import widget components
import JournalWidget from '../widget/widgets/JournalWidget/JournalWidget';

// ============================================
// WIDGET COMPONENTS REGISTRY
// ============================================

const WIDGET_COMPONENTS = {
  // Personal Life
  'journal': JournalWidget,
  'photo-album': ({ widget }) => <div className="space-widget-placeholder">📷 Photo Album - Coming Soon</div>,
  'habit-tracker': ({ widget }) => <div className="space-widget-placeholder">✅ Habit Tracker - Coming Soon</div>,
  
  // Productivity
  'tasks': ({ widget }) => <div className="space-widget-placeholder">✓ Task Manager - Coming Soon</div>,
  'notes': ({ widget }) => <div className="space-widget-placeholder">📝 Notes - Coming Soon</div>,
  'calendar': ({ widget }) => <div className="space-widget-placeholder">📅 Calendar - Coming Soon</div>,
  
  // Utilities
  'calculator': ({ widget }) => <div className="space-widget-placeholder">🔢 Calculator - Coming Soon</div>,
};

// ============================================
// WIDGET MODAL (Preview + Full Mode)
// ============================================

const WidgetModal = ({ widget, onClose, accentColor, spaceId, mode, onModeChange }) => {
  const queryClient = useQueryClient();
  
  const updateConfigMutation = useMutation({
    mutationFn: (config) => updateWidgetConfig(spaceId, widget.id, config),
    onSuccess: () => {
      queryClient.invalidateQueries(['spaces']);
    }
  });
  
  const handleConfigUpdate = (config) => {
    updateConfigMutation.mutate(config);
  };
  
  const WidgetComponent = WIDGET_COMPONENTS[widget.widget_type] || (() => (
    <div className="space-widget-placeholder">
      <div className="space-widget-placeholder-icon">🔧</div>
      <p>Widget "{widget.widget_type}" not implemented yet</p>
    </div>
  ));
  
  const isFullMode = mode === 'full';
  
  const modalContent = (
    <motion.div 
      className="space-widget-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className={`space-widget-modal ${isFullMode ? 'full-mode' : 'preview-mode'}`}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ 
          type: 'spring',
          damping: 25,
          stiffness: 300
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="space-widget-modal-header"
          style={{ borderBottom: `1px solid ${accentColor}30` }}
        >
          <div className="space-widget-modal-title">
            <div 
              className="space-widget-title-indicator" 
              style={{ background: accentColor }}
            />
            <span>{widget.name}</span>
            {updateConfigMutation.isLoading && (
              <span className="space-widget-saving-indicator">
                <span className="space-widget-saving-dot"></span>
                Saving...
              </span>
            )}
          </div>
          
          <div className="space-widget-modal-actions">
            {!isFullMode && (
              <button 
                className="space-widget-action-btn"
                onClick={() => onModeChange('full')}
                title="Open Full Window"
                style={{ color: accentColor }}
              >
                <FaExternalLinkAlt />
              </button>
            )}
            {isFullMode && (
              <button 
                className="space-widget-action-btn"
                onClick={() => onModeChange('preview')}
                title="Back to Preview"
              >
                <FaCompress />
              </button>
            )}
            <button 
              className="space-widget-action-btn close"
              onClick={onClose}
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-widget-modal-content">
          <WidgetComponent 
            widget={widget}
            mode={isFullMode ? 'full' : 'preview'}
            onConfigUpdate={handleConfigUpdate}
            spaceId={spaceId}
          />
        </div>
      </motion.div>
    </motion.div>
  );
  
  return ReactDOM.createPortal(modalContent, document.body);
};

// ============================================
// WIDGET CARD (Shows Real Data)
// ============================================

const WidgetCard = ({ widget, accentColor, onRemove, spaceId, isEditMode, onClick }) => {
  const getWidgetIcon = (type) => {
    const widgetDef = WIDGET_REGISTRY.find(w => w.id === type);
    return widgetDef?.icon;
  };
  
  const Icon = getWidgetIcon(widget.widget_type);
  const WidgetComponent = WIDGET_COMPONENTS[widget.widget_type];

  return (
    <motion.div 
      className={`space-widget-card ${isEditMode ? 'edit-mode' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div 
        className="space-widget-accent-line" 
        style={{ background: accentColor }}
      />
      
      {/* Header */}
      <div className="space-widget-header">
        {isEditMode && (
          <span className="space-widget-drag-handle">
            <FaGripVertical />
          </span>
        )}
        <div 
          className="space-widget-icon-wrapper" 
          style={{ 
            background: `${accentColor}15`,
            borderColor: `${accentColor}30`,
            color: accentColor
          }}
        >
          {Icon && <Icon className="space-widget-icon" style={{ color: accentColor }} />}
        </div>
        <div className="space-widget-title-section">
          <span className="space-widget-title">{widget.name}</span>
          <span className="space-widget-subtitle">{widget.description}</span>
        </div>
        <div className="space-widget-actions">
          {!isEditMode && (
            <button 
              className="space-widget-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              title="Open Widget"
            >
              <FaExpand />
            </button>
          )}
          {isEditMode && (
            <button 
              className="space-widget-action-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove Widget"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
      
      {/* Body - Shows Real Widget Preview */}
      <div 
        className="space-widget-body" 
        onClick={!isEditMode ? onClick : undefined}
        style={{ 
          cursor: isEditMode ? 'default' : 'pointer',
          pointerEvents: isEditMode ? 'none' : 'auto'
        }}
      >
        <div className="space-widget-content">
          {!isEditMode && WidgetComponent ? (
            <WidgetComponent 
              widget={widget}
              mode="compact"
              isCompact={true}
              spaceId={spaceId}
            />
          ) : (
            <div className="space-widget-hint">
              <FaGripVertical />
              <span>Drag to move • Resize from corner</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const WidgetInteraction = ({ widget, accentColor, onRemove, spaceId, isEditMode }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('preview'); // 'preview' or 'full'
  
  const handleCardClick = () => {
    if (!isEditMode) {
      setModalMode('preview');
      setShowModal(true);
    }
  };

  return (
    <>
      <WidgetCard
        widget={widget}
        accentColor={accentColor}
        onRemove={onRemove}
        spaceId={spaceId}
        isEditMode={isEditMode}
        onClick={handleCardClick}
      />
      
      {showModal && !isEditMode && (
        <WidgetModal 
          widget={widget}
          onClose={() => setShowModal(false)}
          accentColor={accentColor}
          spaceId={spaceId}
          mode={modalMode}
          onModeChange={setModalMode}
        />
      )}
    </>
  );
};

export default WidgetInteraction;