import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaExpand, FaCompress, FaCode, FaCalculator, 
  FaChartLine, FaTasks, FaCalendar, FaPalette, FaComments,
  FaTerminal, FaBitcoin, FaGraduationCap, FaMusic, FaPencilAlt
} from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWidgetConfig } from '../../../services/space';
import './WidgetInteraction.css';

// Import widget components
import CalculatorWidget from './widgets/CalculatorWidget';
import TaskManagerWidget from './widgets/TaskManagerWidget';
import NotesWidget from './widgets/NotesWidget';
// Import other widgets as you create them...

// ============================================
// WIDGET COMPONENTS REGISTRY
// ============================================

const WIDGET_COMPONENTS = {
  'calculator': CalculatorWidget,
  'tasks': TaskManagerWidget,
  'note-taking': NotesWidget,
  // Add more as you create them
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
  const [position, setPosition] = useState({ 
    x: window.innerWidth / 2 - 300, 
    y: 100 
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = React.useRef({ startX: 0, startY: 0 });
  
  // Mutation for updating widget config
  const updateConfigMutation = useMutation({
    mutationFn: (config) => updateWidgetConfig(spaceId, widget.id, config),
    onSuccess: () => {
      // Invalidate space query to refresh widget data
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
  
  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.widget-modal-content')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);
  
  return (
    <motion.div
      className={`floating-widget-modal ${isExpanded ? 'expanded' : ''}`}
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      style={{
        left: position.x,
        top: position.y,
        width: isExpanded ? '80vw' : '600px',
        height: isExpanded ? '80vh' : 'auto',
        maxWidth: isExpanded ? '1400px' : '600px'
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Header */}
      <div 
        className="floating-widget-header"
        onMouseDown={handleMouseDown}
        style={{ 
          borderBottom: `2px solid ${accentColor}`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div className="floating-widget-title">
          <div 
            className="widget-title-indicator" 
            style={{ background: accentColor }}
          />
          <span>{widget.name}</span>
          {updateConfigMutation.isLoading && (
            <span className="widget-saving-indicator">Saving...</span>
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
      
      {/* Content */}
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
      
      {/* Glow Effect */}
      <div 
        className="widget-modal-glow"
        style={{ 
          background: `radial-gradient(circle at 50% 100%, ${accentColor}20 0%, transparent 70%)` 
        }}
      />
    </motion.div>
  );
};

// ============================================
// MAIN WIDGET INTERACTION COMPONENT
// ============================================

const WidgetInteraction = ({ widget, accentColor, onRemove, spaceId }) => {
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
  
  return (
    <>
      {/* Widget Card */}
      <motion.div 
        className={`widget-card size-${widget.size}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        layout
      >
        <div className="widget-edge" style={{ background: accentColor }} />
        
        <div className="widget-header">
          <span className="widget-icon"><Icon /></span>
          <span className="widget-title">{widget.name}</span>
          <div className="widget-actions">
            <button 
              className="widget-action-btn"
              onClick={() => setShowModal(true)}
              title="Open Widget"
            >
              <FaExpand />
            </button>
            <button 
              className="widget-action-btn"
              onClick={onRemove}
              title="Remove Widget"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        
        <div className="widget-body" onClick={() => setShowModal(true)}>
          <div className="widget-placeholder">
            {widget.description}
            <div className="widget-open-hint">Click to open</div>
          </div>
        </div>
        
        <div 
          className="widget-glow"
          style={{ 
            background: `radial-gradient(circle at 50% 100%, ${accentColor}15 0%, transparent 70%)` 
          }}
        />
      </motion.div>
      
      {/* Floating Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div 
              className="widget-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />
            <FloatingWidgetModal 
              widget={widget}
              onClose={() => setShowModal(false)}
              accentColor={accentColor}
              spaceId={spaceId}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default WidgetInteraction;