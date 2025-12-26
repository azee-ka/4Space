import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { WIDGET_REGISTRY, WIDGET_CATEGORIES } from '../widgetRegistry';

const WidgetLibraryModal = ({ 
  isOpen, 
  onClose, 
  onAddWidget, 
  currentAccentColor,
  isLoading 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredWidgets = selectedCategory === 'all' 
    ? WIDGET_REGISTRY 
    : WIDGET_REGISTRY.filter(w => w.category === selectedCategory);

  if (!isOpen) return null;

  // Add handler for widget selection
  const handleAddWidget = (widget, e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!isLoading) {
      onAddWidget(widget);
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
          className="widget-library-modal" 
          initial={{ scale: 0.9 }} 
          animate={{ scale: 1 }} 
          exit={{ scale: 0.9 }} 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <h2>Widget Library</h2>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* Categories */}
          <div className="widget-categories">
            {WIDGET_CATEGORIES.map(c => {
              const Icon = c.icon;
              const count = c.id === 'all' 
                ? WIDGET_REGISTRY.length 
                : WIDGET_REGISTRY.filter(w => w.category === c.id).length;
              
              return (
                <button 
                  key={c.id} 
                  className={`category-btn ${selectedCategory === c.id ? 'active' : ''}`} 
                  onClick={() => setSelectedCategory(c.id)}
                  style={selectedCategory === c.id ? { 
                    borderColor: currentAccentColor, 
                    background: `${currentAccentColor}20` 
                  } : {}}
                >
                  <Icon style={{ marginRight: '8px' }} /> 
                  {c.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Widget Grid */}
          <div className="widget-grid">
            {filteredWidgets.map(w => {
              const Icon = w.icon;
              return (
                <div 
                  key={w.id} 
                  className="widget-library-item"
                  // Remove onClick from here - make it hover-only
                >
                  <div className="widget-lib-icon">
                    <Icon />
                  </div>
                  <h4>{w.name}</h4>
                  <p>{w.description}</p>
                  <div className="widget-lib-footer">
                    <span className="widget-size-badge">{w.size}</span>
                    <button 
                      className="add-widget-btn" 
                      disabled={isLoading}
                      onClick={(e) => handleAddWidget(w, e)}
                    >
                      <FaPlus /> {isLoading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WidgetLibraryModal;