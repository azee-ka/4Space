import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaArrowLeft, FaCheck, FaSearch, FaStar, FaEdit, FaTrash } from 'react-icons/fa';
import { SPACE_TEMPLATES, getTemplateTypes } from '../utils/spaceTemplates';
import '../styles/createSpaceModal.css';
const CreateSpaceModal = ({ 
  isOpen, 
  onClose, 
  onCreate, 
  isLoading 
}) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Select, 2: Configure, 3: Review
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [spaceConfigs, setSpaceConfigs] = useState({}); // { templateId: { name, description } }
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setCurrentStep(1);
        setSelectedTemplates([]);
        setSpaceConfigs({});
        setSearchQuery('');
        setFilterType('all');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleTemplateSelection = (templateId) => {
    setSelectedTemplates(prev => {
      const newSelection = prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      
      // Initialize config for newly selected templates
      if (!prev.includes(templateId)) {
        const template = SPACE_TEMPLATES.find(t => t.id === templateId);
        setSpaceConfigs(configs => ({
          ...configs,
          [templateId]: {
            name: template.name,
            description: template.definition || 'My custom workspace'
          }
        }));
      }
      
      return newSelection;
    });
  };

  const updateSpaceConfig = (templateId, field, value) => {
    setSpaceConfigs(prev => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [field]: value
      }
    }));
  };

  const removeTemplate = (templateId) => {
    setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    setSpaceConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[templateId];
      return newConfigs;
    });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (selectedTemplates.length === 0) {
        alert('Please select at least one template');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      onClose();
    }
  };

  const handleCreate = () => {
    console.log('🚀 Creating spaces...');
    console.log('Selected templates:', selectedTemplates);
    console.log('Space configs:', spaceConfigs);

    // Validate all spaces have names
    const hasEmptyNames = selectedTemplates.some(
      templateId => !spaceConfigs[templateId]?.name?.trim()
    );

    if (hasEmptyNames) {
      alert('All spaces must have a name');
      return;
    }

    // Create each space
    selectedTemplates.forEach(templateId => {
      const config = spaceConfigs[templateId];
      console.log(`📦 Creating space: "${config.name}"`);
      onCreate(config.name, templateId, config.description);
    });
  };

  // Get unique template types
  const templateTypes = getTemplateTypes();

  // Filter templates
  const filteredTemplates = SPACE_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group templates by type
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const type = template.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="csm-overlay" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={onClose}
        >
          <motion.div 
            className="csm-container" 
            initial={{ scale: 0.92, opacity: 0, y: 30 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 35,
              mass: 0.8
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative Background Elements */}
            <motion.div 
              className="csm-bg-glow csm-bg-glow-1"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 0.15, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            />
            <motion.div 
              className="csm-bg-glow csm-bg-glow-2"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 0.15, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />

            {/* Header */}
            <motion.div 
              className="csm-header"
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.3 }}
            >
              <div className="csm-header-content">
                <motion.button 
                  className="csm-back-btn"
                  onClick={handleBack}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaArrowLeft />
                </motion.button>
                <div className="csm-header-text">
                  <motion.h2 className="csm-title">
                    {currentStep === 1 && (
                      <>
                        <FaStar className="csm-title-icon" />
                        Choose Templates
                      </>
                    )}
                    {currentStep === 2 && (
                      <>
                        <FaEdit className="csm-title-icon" />
                        Configure Your Spaces
                      </>
                    )}
                  </motion.h2>
                  <motion.p className="csm-subtitle">
                    {currentStep === 1 && 
                      `Step 1 of 2 • Select one or more templates • ${selectedTemplates.length} selected`
                    }
                    {currentStep === 2 && 
                      `Step 2 of 2 • Customize each space • Creating ${selectedTemplates.length} space${selectedTemplates.length > 1 ? 's' : ''}`
                    }
                  </motion.p>
                </div>
              </div>
              <motion.button 
                className="csm-close-btn" 
                onClick={onClose}
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes />
              </motion.button>
            </motion.div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {currentStep === 1 ? (
                /* STEP 1: SELECT TEMPLATES */
                <motion.div
                  key="select-templates"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'contents' }}
                >
                  <div className="csm-controls">
                    <motion.div 
                      className="csm-search-bar"
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.25 }}
                    >
                      <FaSearch className="csm-search-icon" />
                      <input
                        type="text"
                        className="csm-search-input"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="csm-filters"
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.13, duration: 0.25 }}
                    >
                      {templateTypes.map((type, index) => (
                        <motion.button
                          key={type}
                          className={`csm-filter-chip ${filterType === type ? 'csm-filter-chip-active' : ''}`}
                          onClick={() => setFilterType(type)}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.15 + (index * 0.02), duration: 0.2 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {type}
                          {type !== 'all' && (
                            <span className="csm-filter-count">
                              {SPACE_TEMPLATES.filter(t => t.type === type).length}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>

                  <motion.div 
                    className="csm-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.18, duration: 0.35 }}
                  >
                    {Object.keys(groupedTemplates).length === 0 ? (
                      <motion.div className="csm-empty">
                        <div className="csm-empty-icon">🔍</div>
                        <p className="csm-empty-title">No templates found</p>
                        <span className="csm-empty-text">Try a different search or filter</span>
                      </motion.div>
                    ) : (
                      Object.entries(groupedTemplates).map(([type, templates], sectionIndex) => (
                        <motion.div 
                          key={type} 
                          className="csm-section"
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.25 + (sectionIndex * 0.08), duration: 0.35 }}
                        >
                          <div className="csm-section-header">
                            <h3 className="csm-section-title">{type}</h3>
                            <span className="csm-section-count">{templates.length}</span>
                          </div>
                          <div className="csm-grid">
                            {templates.map((template, index) => {
                              const Icon = template.icon;
                              const isSelected = selectedTemplates.includes(template.id);
                              
                              return (
                                <motion.div
                                  key={template.id}
                                  className={`csm-card ${isSelected ? 'csm-card-selected' : ''}`}
                                  onClick={() => toggleTemplateSelection(template.id)}
                                  initial={{ scale: 0.88, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ 
                                    delay: 0.3 + (sectionIndex * 0.08) + (index * 0.025),
                                    duration: 0.28,
                                    type: "spring",
                                    stiffness: 250,
                                    damping: 22
                                  }}
                                  whileHover={{ y: -4, scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  style={isSelected ? { 
                                    '--accent-color': template.accentColor
                                  } : {}}
                                >
                                  <div className="csm-card-glow" style={{ background: template.accentColor }}></div>
                                  
                                  <div 
                                    className="csm-card-icon"
                                    style={isSelected ? { color: template.accentColor } : {}}
                                  >
                                    {Icon && <Icon />}
                                  </div>
                                  
                                  <div className="csm-card-content">
                                    <h4 className="csm-card-title">{template.name}</h4>
                                    <p className="csm-card-description">{template.description}</p>
                                    
                                    <div className="csm-card-footer">
                                      <span 
                                        className="csm-card-badge" 
                                        style={isSelected ? {
                                          background: `${template.accentColor}15`,
                                          borderColor: `${template.accentColor}40`,
                                          color: template.accentColor
                                        } : {}}
                                      >
                                        {template.type}
                                      </span>
                                      {template.widgets && template.widgets.length > 0 && (
                                        <span className="csm-card-widgets">
                                          {template.widgets.length} widgets
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      exit={{ scale: 0, rotate: 180 }}
                                      transition={{ 
                                        type: "spring",
                                        stiffness: 350,
                                        damping: 20
                                      }}
                                      className="csm-card-check"
                                      style={{ background: template.accentColor }}
                                    >
                                      <FaCheck />
                                    </motion.div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                /* STEP 2: CONFIGURE SPACES */
                <motion.div
                  key="configure-spaces"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }}
                  className="csm-content csm-configure-content"
                >
                  <div className="csm-config-grid">
                    {selectedTemplates.map((templateId, index) => {
                      const template = SPACE_TEMPLATES.find(t => t.id === templateId);
                      const config = spaceConfigs[templateId] || {};
                      const Icon = template.icon;

                      return (
                        <motion.div
                          key={templateId}
                          className="csm-config-card"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          style={{ borderColor: template.accentColor + '40' }}
                        >
                          {/* Card Header */}
                          <div className="csm-config-card-header" style={{ background: template.accentColor + '10' }}>
                            <div className="csm-config-card-template">
                              <div 
                                className="csm-config-card-icon"
                                style={{ color: template.accentColor }}
                              >
                                {Icon && <Icon />}
                              </div>
                              <div>
                                <div className="csm-config-card-template-name">{template.name}</div>
                                <div className="csm-config-card-template-type">{template.type}</div>
                              </div>
                            </div>
                            <motion.button
                              className="csm-config-card-remove"
                              onClick={() => removeTemplate(templateId)}
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FaTrash />
                            </motion.button>
                          </div>

                          {/* Card Body */}
                          <div className="csm-config-card-body">
                            <div className="csm-config-field">
                              <label className="csm-config-label">
                                Space Name <span style={{ color: template.accentColor }}>*</span>
                              </label>
                              <input
                                type="text"
                                className="csm-config-input"
                                placeholder="Enter space name..."
                                value={config.name || ''}
                                onChange={(e) => updateSpaceConfig(templateId, 'name', e.target.value)}
                                style={{ 
                                  borderColor: config.name ? template.accentColor + '40' : undefined,
                                  focusBorderColor: template.accentColor
                                }}
                              />
                            </div>

                            <div className="csm-config-field">
                              <label className="csm-config-label">Description</label>
                              <textarea
                                className="csm-config-textarea"
                                placeholder="Describe your workspace..."
                                value={config.description || ''}
                                onChange={(e) => updateSpaceConfig(templateId, 'description', e.target.value)}
                                rows={3}
                                style={{ 
                                  borderColor: config.description ? template.accentColor + '40' : undefined 
                                }}
                              />
                            </div>

                            <div className="csm-config-preview">
                              <div className="csm-config-preview-label">Preview:</div>
                              <div className="csm-config-preview-content">
                                <strong>{config.name || 'Untitled Space'}</strong>
                                <span>{config.description || 'No description'}</span>
                                <span className="csm-config-preview-widgets">
                                  {template.widgets?.length || 0} widgets included
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <motion.div 
              className="csm-footer"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.3 }}
            >
              <motion.button 
                className="csm-btn csm-btn-cancel" 
                onClick={onClose}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>

              {currentStep === 1 ? (
                <motion.button 
                  className="csm-btn csm-btn-create" 
                  onClick={handleNext}
                  disabled={selectedTemplates.length === 0}
                  whileHover={selectedTemplates.length > 0 ? { scale: 1.03, y: -2 } : {}}
                  whileTap={selectedTemplates.length > 0 ? { scale: 0.97 } : {}}
                >
                  Next: Configure Spaces →
                </motion.button>
              ) : (
                <motion.button 
                  className="csm-btn csm-btn-create" 
                  onClick={handleCreate}
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.03, y: -2 } : {}}
                  whileTap={!isLoading ? { scale: 0.97 } : {}}
                >
                  {isLoading ? (
                    <>
                      <span className="csm-spinner" />
                      Creating {selectedTemplates.length} Space{selectedTemplates.length > 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Create {selectedTemplates.length} Space{selectedTemplates.length > 1 ? 's' : ''}
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateSpaceModal;