import React, { useState } from 'react';
import './addTabOverlay.css';
import { IoClose, IoSearch, IoCheckmark, IoCloseCircle } from 'react-icons/io5';
import { TAB_COMPONENT_CATEGORIES } from '../tabs/tabComponents';
import useApi from '../../../../utils/useApi';

const AddTabOverlay = ({ onClose, communityId, setCommunity }) => {
    const { callApi } = useApi();

    const categoryKeys = Object.keys(TAB_COMPONENT_CATEGORIES);
    const [search, setSearch] = useState('');
    const [selectedTabs, setSelectedTabs] = useState({});
    const [editingTab, setEditingTab] = useState(null);
    const [activeCategory, setActiveCategory] = useState(categoryKeys[0]);

    const handleSelect = (key, tab) => {
        if (!selectedTabs[key]) {
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
        const newTabs = Object.values(selectedTabs).map(tab => ({
        key: tab.key,
        label: tab.customLabel || tab.label || tab.key,
    }));

    // Optimistically update community.tabs
    setCommunity(prev => ({
        ...prev,
        tabs: [...(prev.tabs || []), ...newTabs]
    }));

        try {
            const response = await callApi(`community/c/${communityId}/tabs/`, 'POST', {
                tabs: Object.values(selectedTabs).map(tab => ({
                    key: tab.key,
                    label: tab.customLabel || tab.label || tab.key,
                }))
            });

            console.log('Submit tabs response:', response.data);
            onClose();
        } catch (error) {
            console.error('Error submitting new tabs:', error);
        }
    };



    return (
        <div className="add-tab-overlay" onClick={onClose}>
            <div className="add-tab-modal" onClick={(e) => e.stopPropagation()}>
                <button className="overlay-close-btn" onClick={onClose}><IoClose /></button>
                <h2>Add Tabs</h2>

                <div className="tab-selector-layout">
                    <div className="tab-sidebar">
                        {categoryKeys.map(category => (
                            <div
                                key={category}
                                className={`tab-sidebar-item ${activeCategory === category ? 'active' : ''}`}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category.toUpperCase()}
                            </div>
                        ))}
                    </div>

                    <div className="tab-content-area">
                        <div className="tab-search-input">
                            <IoSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search tabs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="tab-list">
                            {activeTabs.map(([key, tab]) => (
                                <div
                                    key={key}
                                    className={`tab-item ${selectedTabs[key] ? 'selected' : ''}`}
                                    onClick={() => handleSelect(key, tab)}
                                >
                                    <span className="tab-icon">{tab.icon}</span>
                                    <span className="tab-name">{tab.label || key}</span>
                                    {selectedTabs[key] && <IoCheckmark className="checkmark" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {Object.keys(selectedTabs).length > 0 && (
                    <div className="selected-tabs-bar">
                        {Object.entries(selectedTabs).map(([key, tab]) => {
                            const isEdited = tab.customLabel !== (tab.label || key);
                            const isEditing = editingTab === key;

                            return (
                                <div className={`selected-pill-row ${isEdited ? 'modified' : ''}`} key={key}>
                                    <span className="pill-icon">{tab.icon}</span>

                                    {isEditing ? (
                                        <div className="pill-edit-container">
                                            <input
                                                className="pill-label-input"
                                                value={tab.customLabel}
                                                onChange={(e) => handleLabelChange(key, e.target.value)}
                                                onBlur={() => setEditingTab(null)}
                                                autoFocus
                                            />
                                            {isEdited && <div className="pill-original-static">{tab.label || key}</div>}
                                        </div>
                                    ) : (
                                        <div className="pill-display" onClick={() => setEditingTab(key)}>
                                            <span className="pill-custom-label">{tab.customLabel}</span>
                                            {isEdited && <span className="pill-original-static">{tab.label || key}</span>}
                                        </div>
                                    )}

                                    <IoCloseCircle className="pill-remove" onClick={() => handleRemove(key)} />
                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    className="confirm-add-btn"
                    disabled={Object.keys(selectedTabs).length === 0}
                    onClick={() => handleSubmitNewTabs()}
                >
                    Add Selected Tabs
                </button>
            </div>
        </div>
    );
};

export default AddTabOverlay;
