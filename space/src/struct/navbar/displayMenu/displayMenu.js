import React, { useEffect, useState } from 'react';
import './displayMenu.css';
import { useDisplaySettings } from '../../../context/DisplaySettingsContext';
import useApi from '../../../utils/useApi';

const DisplayMenu = ({ onClose }) => {
    const { settings, setSettings, apply, loaded } = useDisplaySettings();
    const { callApi } = useApi();
    const [savedSettings, setSavedSettings] = useState(null);

    useEffect(() => {
        if (loaded && settings) {
            setSavedSettings(settings);
        }
    }, [loaded, settings]);

    if (!loaded || !settings) {
        return <div className="display-settings-container">Loading...</div>;
    }

    const updateSetting = (key, value) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        apply(updated);
    };

    const resetSettings = () => {
        if (savedSettings) {
            setSettings(savedSettings);
            apply(savedSettings);
        }
    };

    const revertToDefault = () => {
        const defaults = {
            gradient: 'radial',
            color: '#5387be',
            fontSize: '1em',
            darkMode: true,
            padding: 'medium',
            animations: true,
            transparency: 0.15,
            radialPosition: 'top',
            linearAngle: '135deg',
        };
        setSettings(defaults);
        apply(defaults);
    };

    const saveSettings = async () => {
        try {
            await callApi('settings/save/', 'POST', {
                category: 'display',
                settings,
            });
            setSavedSettings(settings);
            onClose();
        } catch (err) {
            console.error("Error saving settings:", err);
        }
    };

    const {
        gradient, color, fontSize, darkMode,
        padding, animations, transparency,
        radialPosition, linearAngle
    } = settings;

    return (
        <div className="display-settings-container" onClick={(e) => e.stopPropagation()}>
            <h3>Display Settings</h3>

            {/* Gradient Type */}
            <div className="display-setting">
                <label>Background Style</label>
                <select value={gradient} onChange={(e) => updateSetting('gradient', e.target.value)}>
                    <option value="radial">Radial</option>
                    <option value="linear">Linear</option>
                    <option value="solid">Solid Color</option>
                </select>
            </div>

            {/* Radial Position */}
            {gradient === 'radial' && (
                <div className="display-setting">
                    <label>Radial Position</label>
                    <select
                        value={radialPosition}
                        onChange={(e) => updateSetting('radialPosition', e.target.value)}
                    >
                        {['top', 'center', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'].map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Linear Angle */}
            {gradient === 'linear' && (
                <div className="display-setting">
                    <label>Linear Angle</label>
                    <div className="slider-wrapper">
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={parseInt(linearAngle)}
                            onChange={(e) => updateSetting('linearAngle', `${e.target.value}deg`)}
                        />
                        <span className="slider-value">{parseInt(linearAngle)}°</span>
                    </div>
                </div>
            )}

            {/* Color Picker */}
            <div className="display-setting">
                <label>Primary Gradient Color</label>
                <div className="color-swatch-grid">
                    {[
                        '#5387be', '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2',
                        '#9d4edd', '#e63946', '#f1fa8c', '#00b4d8', '#ff61a6'
                    ].map(preset => (
                        <div
                            key={preset}
                            className={`color-swatch ${color === preset ? 'active' : ''}`}
                            style={{ backgroundColor: preset }}
                            onClick={() => updateSetting('color', preset)}
                        />
                    ))}
                    <div className="color-swatch color-picker-trigger">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => updateSetting('color', e.target.value)}
                            title="Custom Color"
                        />
                    </div>
                </div>
            </div>

            {/* Transparency */}
            <div className="display-setting">
                <label>Gradient Transparency</label>
                <div className="slider-wrapper">
                    <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={transparency}
                        onChange={(e) => updateSetting('transparency', parseFloat(e.target.value))}
                    />
                    <span className="slider-value">{transparency.toFixed(2)}</span>
                </div>
            </div>

            {/* Font Size */}
            <div className="display-setting">
                <label>Font Size</label>
                <div className="slider-wrapper">
                    <input
                        type="range"
                        min="0.8"
                        max="1.5"
                        step="0.1"
                        value={parseFloat(fontSize)}
                        onChange={(e) => updateSetting('fontSize', `${e.target.value}em`)}
                    />
                    <span className="slider-value">{parseFloat(fontSize).toFixed(1)}em</span>
                </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className="display-setting toggle-group">
                <label>Dark Mode</label>
                <label className="display-toggle">
                    <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={() => updateSetting('darkMode', !darkMode)}
                    />
                    <span className="display-toggle-slider"></span>
                </label>
            </div>

            {/* Padding */}
            <div className="display-setting">
                <label>Padding</label>
                <select value={padding} onChange={(e) => updateSetting('padding', e.target.value)}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                </select>
            </div>

            {/* Animations Toggle */}
            <div className="display-setting toggle-group">
                <label>Enable Animations</label>
                <label className="display-toggle">
                    <input
                        type="checkbox"
                        checked={animations}
                        onChange={() => updateSetting('animations', !animations)}
                    />
                    <span className="display-toggle-slider"></span>
                </label>
            </div>

            {/* Buttons */}
            <div className="button-row">
                <div className="inline-buttons">
                    <button onClick={resetSettings}>Reset</button>
                    <button onClick={revertToDefault}>Revert to Default</button>
                </div>
                <button className="save-button" onClick={saveSettings}>Save</button>
            </div>
        </div>
    );
};

export default DisplayMenu;
