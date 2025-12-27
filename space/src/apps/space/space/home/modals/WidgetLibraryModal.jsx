import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus, FaSearch } from 'react-icons/fa';
import { WIDGET_REGISTRY, WIDGET_CATEGORIES } from '../widget/widgetRegistry';

const WidgetLibraryModal = ({ 
  isOpen, 
  onClose, 
  onAddWidget, 
  currentAccentColor,
  isLoading 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter widgets by category and search
  const filteredWidgets = WIDGET_REGISTRY.filter(w => {
    // Category filter
    const categoryMatch = selectedCategory === 'all' || w.category === selectedCategory;
    
    // Search filter
    const searchMatch = !searchQuery || 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return categoryMatch && searchMatch;
  });
  
  // Group widgets by category for display
  const groupedWidgets = selectedCategory === 'all' 
    ? WIDGET_CATEGORIES.slice(1).reduce((acc, category) => {
        const widgets = filteredWidgets.filter(w => w.category === category.id);
        if (widgets.length > 0) {
          acc[category.id] = { category, widgets };
        }
        return acc;
      }, {})
    : null;

  if (!isOpen) return null;

  const handleAddWidget = (widget, e) => {
    e.stopPropagation();
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
            <div>
              <h2>Widget Library</h2>
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '14px', 
                color: 'rgba(255,255,255,0.5)' 
              }}>
                Add functional tools to your space
              </p>
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
              />
            </div>
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
                  onClick={() => {
                    setSelectedCategory(c.id);
                    setSearchQuery('');
                  }}
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
            {selectedCategory === 'all' && !searchQuery ? (
              // Grouped by category
              Object.values(groupedWidgets || {}).map(({ category, widgets }) => (
                <div key={category.id} className="widget-category-group">
                  <div className="category-group-header">
                    <category.icon />
                    <h3>{category.name}</h3>
                    <span className="category-count">{widgets.length}</span>
                  </div>
                  <div className="category-widgets-grid">
                    {widgets.map(w => {
                      const Icon = w.icon;
                      return (
                        <WidgetCard
                          key={w.id}
                          widget={w}
                          Icon={Icon}
                          onAdd={handleAddWidget}
                          isLoading={isLoading}
                          accentColor={currentAccentColor}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              // Flat list
              filteredWidgets.length > 0 ? (
                filteredWidgets.map(w => {
                  const Icon = w.icon;
                  return (
                    <WidgetCard
                      key={w.id}
                      widget={w}
                      Icon={Icon}
                      onAdd={handleAddWidget}
                      isLoading={isLoading}
                      accentColor={currentAccentColor}
                    />
                  );
                })
              ) : (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <p>No widgets found</p>
                  <span>Try a different search or category</span>
                </div>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Widget Card Component
const WidgetCard = ({ widget, Icon, onAdd, isLoading, accentColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      className="widget-library-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
    >
      <div className="widget-lib-icon" style={isHovered ? { color: accentColor } : {}}>
        <Icon />
      </div>
      <h4>{widget.name}</h4>
      <p>{widget.description}</p>
      
      {widget.features && widget.features.length > 0 && (
        <div className="widget-features">
          {widget.features.slice(0, 3).map((feature, i) => (
            <span key={i} className="feature-tag">{feature}</span>
          ))}
          {widget.features.length > 3 && (
            <span className="feature-tag">+{widget.features.length - 3} more</span>
          )}
        </div>
      )}
      
      <div className="widget-lib-footer">
        <span className="widget-size-badge">{widget.size}</span>
        <button 
          className="add-widget-btn" 
          disabled={isLoading}
          onClick={(e) => onAdd(widget, e)}
          style={isHovered ? {
            background: `${accentColor}30`,
            borderColor: accentColor,
            color: accentColor
          } : {}}
        >
          <FaPlus /> {isLoading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </motion.div>
  );
};

export default WidgetLibraryModal;