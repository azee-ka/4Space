import React, { useState, useMemo } from 'react';
import './addTabOverlay.css';
import { IoClose, IoSearch, IoCheckmark, IoCloseCircle } from 'react-icons/io5';
import { TAB_COMPONENT_CATEGORIES } from '../tabs/tabComponents';
import { useCommunity } from '../../../../context/CommunityContext';

const AddTabOverlay = ({ onClose }) => {
    const { community, addTabs } = useCommunity();

    const categoryKeys = Object.keys(TAB_COMPONENT_CATEGORIES);
    const [search, setSearch] = useState('');
    const [selectedTabs, setSelectedTabs] = useState({});
    const [editingTab, setEditingTab] = useState(null);
    const [activeCategory, setActiveCategory] = useState(categoryKeys[0]);

    const existingTabKeys = useMemo(
        () => new Set((community?.tabs || []).map(tab => tab.key)),
        [community]
    );

    const handleSelect = (key, tab) => {
        if (!selectedTabs[key] && !existingTabKeys.has(key)) {
            setSelectedTabs(prev => ({
                ...prev,
                [key]: { ...tab, customLabel: tab.label || key }
            }));
        }
    };

    const handleRemove = (key) => {
        const updated = { ...selectedTabs };
        delete updated[key];
        setSelectedTabs(updated);
        if (editingTab === key) setEditingTab(null);
    };

    const handleLabelChange = (key, label) => {
        setSelectedTabs(prev => ({
            ...prev,
            [key]: { ...prev[key], customLabel: label }
        }));
    };

    const activeTabs = Object.entries(TAB_COMPONENT_CATEGORIES[activeCategory] || {}).filter(
        ([key]) => key.toLowerCase().includes(search.toLowerCase())
    );

const handleSubmitNewTabs = async () => {
  const newTabs = Object.values(selectedTabs)
    .filter(tab => !existingTabKeys.has(tab.key))
    .map(tab => ({
      key: tab.key,
      label: tab.customLabel || tab.label || tab.key,
    }));

  if (newTabs.length === 0) {
    onClose();
    return;
  }

  try {
    await addTabs(newTabs); // now waits for server update
    onClose();
  } catch (err) {
    console.error("Failed to add tabs", err);
  }
};

    return (
        <div className="addtab-overlay" onClick={onClose}>
            <div className="addtab-modal" onClick={e => e.stopPropagation()}>
                <button className="addtab-overlay-close-btn" onClick={onClose}><IoClose /></button>
                <h2 className="addtab-title">Add Tabs</h2>

                <div className="addtab-selector-layout">
                    <div className="addtab-sidebar">
                        {categoryKeys.map(category => (
                            <div
                                key={category}
                                className={`addtab-sidebar-item ${activeCategory === category ? 'active' : ''}`}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category.toUpperCase()}
                            </div>
                        ))}
                    </div>

                    <div className="addtab-content-area">
                        <div className="addtab-search-input">
                            <IoSearch className="addtab-search-icon" />
                            <input
                                type="text"
                                placeholder="Search tabs..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="addtab-list">
                            {activeTabs.map(([key, tab]) => {
                                const alreadyAdded = existingTabKeys.has(key);
                                const isSelected = !!selectedTabs[key];
                                return (
                                    <div
                                        key={key}
                                        className={`addtab-tab-item ${isSelected ? 'selected' : ''} ${alreadyAdded ? 'addtab-tab-disabled' : ''}`}
                                        onClick={() => {
                                            if (!alreadyAdded) handleSelect(key, tab);
                                        }}
                                        title={alreadyAdded ? "This tab is already added to the community." : ""}
                                        style={alreadyAdded ? { opacity: 0.6, pointerEvents: 'none' } : {}}
                                    >
                                        <span className="addtab-tab-icon">{tab.icon}</span>
                                        <span className="addtab-tab-name">{tab.label || key}</span>
                                        {isSelected && <IoCheckmark className="addtab-checkmark" />}
                                        {alreadyAdded && <span style={{ color: '#00e5ff', marginLeft: 10, fontSize: '0.85em' }}>(Added)</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {Object.keys(selectedTabs).length > 0 && (
                    <div className="addtab-selected-tabs-bar">
                        {Object.entries(selectedTabs).map(([key, tab]) => {
                            const isEdited = tab.customLabel !== (tab.label || key);
                            const isEditing = editingTab === key;

                            return (
                                <div className={`addtab-selected-pill-row ${isEdited ? 'modified' : ''}`} key={key}>
                                    <span className="addtab-pill-icon">{tab.icon}</span>
                                    {isEditing ? (
                                        <div className="addtab-pill-edit-container">
                                            <input
                                                className="addtab-pill-label-input"
                                                value={tab.customLabel}
                                                onChange={e => handleLabelChange(key, e.target.value)}
                                                onBlur={() => setEditingTab(null)}
                                                autoFocus
                                            />
                                            {isEdited && <div className="addtab-pill-original-static">{tab.label || key}</div>}
                                        </div>
                                    ) : (
                                        <div className="addtab-pill-display" onClick={() => setEditingTab(key)}>
                                            <span className="addtab-pill-custom-label">{tab.customLabel}</span>
                                            {isEdited && <span className="addtab-pill-original-static">{tab.label || key}</span>}
                                        </div>
                                    )}

                                    <IoCloseCircle className="addtab-pill-remove" onClick={() => handleRemove(key)} />
                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    className="addtab-confirm-add-btn"
                    disabled={Object.keys(selectedTabs).length === 0}
                    onClick={handleSubmitNewTabs}
                >
                    Add Selected Tabs
                </button>
            </div>
        </div>
    );
};

export default AddTabOverlay;
