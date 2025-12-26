import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaExpand, FaCompress, FaCode, FaCalculator, 
  FaChartLine, FaTasks, FaCalendar, FaPalette, FaComments,
  FaTerminal, FaBitcoin, FaGraduationCap, FaMusic, FaPencilAlt,
  FaGripVertical
} from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWidgetConfig } from '../../../../services/space';
import './WidgetInteraction.css';

import CalculatorWidget from '../widgets/CalculatorWidget';
import TaskManagerWidget from '../widgets/TaskManagerWidget';
import NotesWidget from '../widgets/NotesWidget';

// ============================================
// WIDGET COMPONENTS REGISTRY
// ============================================

const WIDGET_COMPONENTS = {
  'calculator': CalculatorWidget,
  'tasks': TaskManagerWidget,
  'note-taking': NotesWidget,
  'code-editor': ({ widget }) => <div className="widget-placeholder">Code Editor - Coming Soon</div>,
  'crypto-ticker': ({ widget }) => <div className="widget-placeholder">Crypto Ticker - Coming Soon</div>,
  'canvas': ({ widget }) => <div className="widget-placeholder">Drawing Canvas - Coming Soon</div>,
  'calendar': ({ widget }) => <div className="widget-placeholder">Calendar - Coming Soon</div>,
  'pomodoro': ({ widget }) => <div className="widget-placeholder">Pomodoro - Coming Soon</div>,
};

// ============================================
// FLOATING WIDGET MODAL
// ============================================

const FloatingWidgetModal = ({ widget, onClose, accentColor, spaceId }) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const updateConfigMutation = useMutation({
    mutationFn: (config) => updateWidgetConfig(spaceId, widget.id, config),
    onSuccess: () => {
      queryClient.invalidateQueries(['spaces']);
    },
    onError: (error) => {
      console.error('Failed to save widget config:', error);
    }
  });
  
  const handleConfigUpdate = (config) => {
    updateConfigMutation.mutate(config);
  };
  
  const WidgetComponent = WIDGET_COMPONENTS[widget.widget_type];
  
  const modalContent = (
    <AnimatePresence>
      <motion.div 
        className="widget-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div
          className={`floating-widget-modal ${isExpanded ? 'expanded' : ''}`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="floating-widget-header"
            style={{ borderBottom: `1px solid ${accentColor}30` }}
          >
            <div className="floating-widget-title">
              <div 
                className="widget-title-indicator" 
                style={{ background: accentColor }}
              />
              <span>{widget.name}</span>
              {updateConfigMutation.isLoading && (
                <span className="widget-saving-indicator">
                  <span className="saving-dot"></span>
                  Saving...
                </span>
              )}
            </div>
            <div className="floating-widget-actions">
              <button 
                className="widget-action-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Minimize' : 'Maximize'}
              >
                {isExpanded ? <FaCompress /> : <FaExpand />}
              </button>
              <button 
                className="widget-action-btn close"
                onClick={onClose}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="widget-modal-content">
            {WidgetComponent ? (
              <WidgetComponent 
                widget={widget}
                isExpanded={isExpanded}
                onConfigUpdate={handleConfigUpdate}
              />
            ) : (
              <div className="widget-placeholder">
                <div className="placeholder-icon">{widget.description}</div>
                <p>Widget functionality coming soon</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  
  // Render modal using Portal to body
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

// ============================================
// MAIN WIDGET INTERACTION COMPONENT
// ============================================

const WidgetInteraction = ({ widget, accentColor, onRemove, spaceId, isEditMode }) => {
  const [showModal, setShowModal] = useState(false);
  
  const getWidgetIcon = (type) => {
    const icons = {
      'calculator': FaCalculator,
      'tasks': FaTasks,
      'code-editor': FaCode,
      'crypto-ticker': FaBitcoin,
      'canvas': FaPalette,
      'note-taking': FaPencilAlt,
      'calendar': FaCalendar,
      'pomodoro': FaTerminal,
      'chat': FaComments,
      'music-player': FaMusic
    };
    return icons[type] || FaCode;
  };
  
  const Icon = getWidgetIcon(widget.widget_type);

  const handleWidgetClick = (e) => {
    if (!isEditMode) {
      setShowModal(true);
    }
  };
  
  return (
    <>
      <motion.div 
        className={`widget-card size-${widget.size} ${isEditMode ? 'edit-mode' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ height: '100%', width: '100%' }}
        layout
      >
        <div 
          className="widget-accent-line" 
          style={{ background: accentColor }}
        />
        
        <div className="widget-header">
          {isEditMode && (
            <span className="widget-drag-handle">
              <FaGripVertical />
            </span>
          )}
          <div 
            className="widget-icon-wrapper" 
            style={{ 
              background: `${accentColor}15`,
              borderColor: `${accentColor}30`
            }}
          >
            <Icon className="widget-icon" style={{ color: accentColor }} />
          </div>
          <div className="widget-title-section">
            <span className="widget-title">{widget.name}</span>
            <span className="widget-subtitle">{widget.description}</span>
          </div>
          <div className="widget-actions">
            {!isEditMode && (
              <button 
                className="widget-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                title="Open Widget"
              >
                <FaExpand />
              </button>
            )}
            {isEditMode && (
              <button 
                className="widget-action-btn danger"
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
        
        <div 
          className="widget-body" 
          onClick={handleWidgetClick}
          style={{ 
            cursor: isEditMode ? 'default' : 'pointer',
            pointerEvents: isEditMode ? 'none' : 'auto'
          }}
        >
          <div className="widget-content">
            {!isEditMode ? (
              <div className="widget-hint">
                <FaExpand />
                <span>Click to expand</span>
              </div>
            ) : (
              <div className="widget-hint">
                <FaGripVertical />
                <span>Drag to move • Resize from corner</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {showModal && !isEditMode && (
        <FloatingWidgetModal 
          widget={widget}
          onClose={() => setShowModal(false)}
          accentColor={accentColor}
          spaceId={spaceId}
        />
      )}
    </>
  );
};

export default WidgetInteraction;