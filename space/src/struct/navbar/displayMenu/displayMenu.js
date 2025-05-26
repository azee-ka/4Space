import React, { useState } from 'react';
import './displayMenu.css';

const DisplayMenu = ({ onClose }) => {
  const defaultSettings = {
    gradient: 'radial',
    color: '#5387be',
    fontSize: '1em',
    darkMode: true,
    padding: 'medium',
    animations: true,
    transparency: 0.15,
  };

  const [savedSettings, setSavedSettings] = useState(defaultSettings);
  const [settings, setSettings] = useState(defaultSettings);

  const { gradient, color, fontSize, darkMode, padding, animations, transparency } = settings;

  function colorToRgba(hex, alpha) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const applySettings = (customSettings = settings) => {
    const {
      fontSize, color, darkMode, gradient, transparency
    } = customSettings;

    document.documentElement.style.setProperty('--base-font-size', fontSize);
    document.documentElement.style.setProperty('--theme-color', color);
    document.body.className = darkMode ? 'dark' : 'light';

    const transparentColor = colorToRgba(color, transparency);
    let backgroundValue = gradient === 'radial'
      ? `radial-gradient(circle at top, ${transparentColor}, rgba(0, 0, 0, 0))`
      : gradient === 'linear'
      ? `linear-gradient(to bottom right, ${transparentColor}, rgba(0, 0, 0, 0))`
      : transparentColor;

    document.querySelector('.App').style.background = backgroundValue;
  };

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      applySettings(updated);
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(savedSettings);
    applySettings(savedSettings);
  };

  const saveSettings = async () => {
    try {
      await fetch('/api/user/display-settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      setSavedSettings(settings);
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  return (
    <div className="display-settings-container" onClick={(e) => e.stopPropagation()}>
      <h3>Display Settings</h3>

      <div className="display-setting">
        <label>Background Style</label>
        <select value={gradient} onChange={(e) => updateSetting('gradient', e.target.value)}>
          <option value="radial">Radial</option>
          <option value="linear">Linear</option>
          <option value="solid">Solid Color</option>
        </select>
      </div>

      <div className="display-setting">
        <label>Primary Gradient Color</label>
        <div className="color-swatch-grid">
          {[
            '#5387be', '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2',
            '#9d4edd', '#e63946', '#f1fa8c', '#00b4d8', '#ff61a6'
          ].map((presetColor) => (
            <div
              key={presetColor}
              className={`color-swatch ${color === presetColor ? 'active' : ''}`}
              style={{ backgroundColor: presetColor }}
              onClick={() => updateSetting('color', presetColor)}
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

      <div className="display-setting toggle-group">
        <label htmlFor="darkModeToggle">Dark Mode</label>
        <label className="display-toggle">
          <input
            type="checkbox"
            id="darkModeToggle"
            checked={darkMode}
            onChange={() => updateSetting('darkMode', !darkMode)}
          />
          <span className="display-toggle-slider"></span>
        </label>
      </div>

      <div className="display-setting">
        <label>Padding</label>
        <select value={padding} onChange={(e) => updateSetting('padding', e.target.value)}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="display-setting toggle-group">
        <label htmlFor="animationsToggle">Enable Animations</label>
        <label className="display-toggle">
          <input
            type="checkbox"
            id="animationsToggle"
            checked={animations}
            onChange={() => updateSetting('animations', !animations)}
          />
          <span className="display-toggle-slider"></span>
        </label>
      </div>

      <div className="button-row">
        <button onClick={resetSettings}>Reset</button>
        <button onClick={saveSettings}>Save</button>
      </div>
    </div>
  );
};

export default DisplayMenu;
