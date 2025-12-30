import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSearch, FaPlus, FaCheck } from 'react-icons/fa';
import { 
  WIDGET_REGISTRY, 
  WIDGET_CATEGORIES, 
  getWidgetsByCategory, 
  searchWidgets 
} from '../utils/widgetRegistry';

const WidgetLibraryModal = ({ 
  isOpen, 
  onClose, 
  onAddWidget, 
  currentAccentColor,
  isLoading,
  addedWidgets = [],
  existingWidgets = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWidgets, setSelectedWidgets] = useState([]);

  // Reset selections when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedWidgets([]);
        setSearchQuery('');
        setSelectedCategory('all');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Get filtered widgets
  const filteredWidgets = useMemo(() => {
    let widgets = searchQuery 
      ? searchWidgets(searchQuery)
      : getWidgetsByCategory(selectedCategory);
    
    return widgets;
  }, [searchQuery, selectedCategory]);

  // Group widgets by category for "all" view
  const groupedWidgets = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredWidgets };
    }

    const groups = {};
    WIDGET_CATEGORIES.forEach(cat => {
      if (cat.id === 'all') return;
      const widgets = filteredWidgets.filter(w => w.category === cat.id);
      if (widgets.length > 0) {
        groups[cat.id] = widgets;
      }
    });
    return groups;
  }, [filteredWidgets, selectedCategory]);

  const toggleWidgetSelection = (widget) => {
    if (addedWidgets.includes(widget.id)) return;
    
    setSelectedWidgets(prev => {
      if (prev.some(w => w.id === widget.id)) {
        return prev.filter(w => w.id !== widget.id);
      } else {
        return [...prev, widget];
      }
    });
  };

  const handleAddSelectedWidgets = async () => {
    if (selectedWidgets.length === 0) return;
    
    console.log('📦 Adding multiple widgets:', selectedWidgets.map(w => w.name));
    
    // Add widgets SEQUENTIALLY without pre-calculating positions
    // Each mutation will calculate its own position based on current state
    for (let i = 0; i < selectedWidgets.length; i++) {
      const widget = selectedWidgets[i];
      
      console.log(`  ➕ Adding widget ${i + 1}/${selectedWidgets.length}: ${widget.name}`);
      
      // Add widget and WAIT for it to complete
      // Pass 'batch' flag to indicate this is part of a batch operation
      await onAddWidget(widget, 'batch');
      
      // Small delay to ensure queries are invalidated and state is updated
      // Increased to 200ms to prevent size glitching on last widget
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('✅ All widgets added successfully!');
    
    // Clear selection and close modal
    setSelectedWidgets([]);
    onClose();
  };

  const isWidgetSelected = (widgetId) => {
    return selectedWidgets.some(w => w.id === widgetId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div 
            className="widget-library-modal"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ 
              duration: 0.15,
              ease: [0.16, 1, 0.3, 1]
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div>
                <h2>Widget Library</h2>
                {selectedWidgets.length > 0 && (
                  <motion.p 
                    className="modal-subtitle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {selectedWidgets.length} widget{selectedWidgets.length > 1 ? 's' : ''} selected
                  </motion.p>
                )}
              </div>
              <button className="close-btn" onClick={onClose}>
                <FaTimes />
              </button>
            </div>

            {/* Search */}
            <div className="widget-search">
              <div className="search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search widgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="widget-categories">
              {WIDGET_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSearchQuery('');
                    }}
                    style={selectedCategory === category.id ? {
                      borderColor: `${currentAccentColor}80`,
                      background: `${currentAccentColor}15`,
                      color: currentAccentColor
                    } : {}}
                  >
                    <Icon />
                    {category.name}
                  </button>
                );
              })}
            </div>

            {/* Widget Grid */}
            <div className="widget-grid">
              {Object.keys(groupedWidgets).length === 0 ? (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <p>No widgets found</p>
                  <span>Try a different search or category</span>
                </div>
              ) : (
                Object.entries(groupedWidgets).map(([categoryId, widgets]) => {
                  const category = WIDGET_CATEGORIES.find(c => c.id === categoryId);
                  const CategoryIcon = category?.icon;

                  return (
                    <div key={categoryId} className="widget-category-group">
                      {selectedCategory === 'all' && (
                        <div className="category-group-header">
                          {CategoryIcon && <CategoryIcon />}
                          <h3>{category?.name}</h3>
                          <span className="category-count">{widgets.length}</span>
                        </div>
                      )}
                      
                      <div className="category-widgets-grid">
                        {widgets.map((widget) => {
                          const Icon = widget.icon;
                          const isAdded = addedWidgets.includes(widget.id);
                          const isSelected = isWidgetSelected(widget.id);

                          return (
                            <div
                              key={widget.id}
                              className={`widget-library-item ${isAdded ? 'added' : ''} ${isSelected ? 'selected' : ''} ${isLoading ? 'loading' : ''}`}
                              onClick={() => !isAdded && toggleWidgetSelection(widget)}
                              style={isSelected ? {
                                borderColor: currentAccentColor,
                                background: `linear-gradient(145deg, ${currentAccentColor}08 0%, rgba(10, 12, 16, 0.98) 100%)`
                              } : {}}
                            >
                              {/* Selection indicator */}
                              {isSelected && (
                                <motion.div
                                  className="widget-selection-check"
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 90 }}
                                  transition={{ 
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 25
                                  }}
                                  style={{ background: currentAccentColor }}
                                >
                                  <FaCheck />
                                </motion.div>
                              )}

                              {/* Category badge */}
                              <span className="widget-category-badge">
                                {category?.name || widget.category}
                              </span>

                              {/* Icon with accent color glow */}
                              <div 
                                className="widget-lib-icon-wrapper"
                                style={{ 
                                  color: currentAccentColor,
                                  borderColor: isSelected ? currentAccentColor : 'rgba(255, 255, 255, 0.08)',
                                  background: isSelected ? `${currentAccentColor}10` : 'rgba(255, 255, 255, 0.04)'
                                }}
                              >
                                <Icon className="widget-lib-icon" />
                              </div>

                              {/* Header */}
                              <div className="widget-lib-header">
                                <h4>{widget.name}</h4>
                                <p>{widget.description}</p>
                              </div>

                              {/* Features */}
                              {widget.features && widget.features.length > 0 && (
                                <div className="widget-features">
                                  {widget.features.slice(0, 3).map((feature, idx) => (
                                    <div key={idx} className="feature-tag">
                                      {feature}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Footer */}
                              <div className="widget-lib-footer">
                                <span className="widget-size-badge">
                                  {widget.size || 'medium'}
                                </span>
                                <div className="widget-status-indicator">
                                  {isAdded ? (
                                    <span className="status-added">
                                      <FaCheck /> Added
                                    </span>
                                  ) : isSelected ? (
                                    <span className="status-selected" style={{ color: currentAccentColor }}>
                                      <FaCheck /> Selected
                                    </span>
                                  ) : (
                                    <span className="status-available">
                                      Click to select
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Add Button */}
            <AnimatePresence>
              {selectedWidgets.length > 0 && (
                <motion.div 
                  className="modal-footer"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button 
                    className="clear-selection-btn"
                    onClick={() => setSelectedWidgets([])}
                    disabled={isLoading}
                  >
                    Clear Selection
                  </button>
                  <button 
                    className="add-selected-btn"
                    onClick={handleAddSelectedWidgets}
                    disabled={isLoading}
                    style={{ 
                      background: `${currentAccentColor}20`,
                      borderColor: currentAccentColor,
                      color: currentAccentColor
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-small" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <FaPlus />
                        Add {selectedWidgets.length} Widget{selectedWidgets.length > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WidgetLibraryModal;