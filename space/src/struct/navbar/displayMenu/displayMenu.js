import React, { useState } from 'react';
import './displayMenu.css';
import useApi from '../../../utils/useApi';

const defaultSettings = {
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

const DisplayMenu = ({ onClose }) => {
  const { callApi } = useApi();

  const [savedSettings, setSavedSettings] = useState(defaultSettings);
  const [settings, setSettings] = useState(defaultSettings);

  const {
    gradient, color, fontSize, darkMode, padding, animations, transparency
  } = settings;

  function colorToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string' || hex.length !== 7) {
    hex = '#5387be';
  }
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

  function applySettings(customSettings = settings) {
  const {
    fontSize,
    color,
    darkMode,
    gradient,
    transparency,
    radialPosition,
    linearAngle
  } = customSettings;

  document.documentElement.style.setProperty('--base-font-size', fontSize);
  document.documentElement.style.setProperty('--theme-color', color);
  document.body.className = darkMode ? 'dark' : 'light';

  let backgroundValue;

  if (gradient === 'radial') {
    const transparentColor = colorToRgba(color, transparency);
    backgroundValue = `radial-gradient(circle at ${radialPosition}, ${transparentColor}, rgba(0,0,0,0))`;
  } else if (gradient === 'linear') {
    const transparentColor = colorToRgba(color, transparency);
    backgroundValue = `linear-gradient(${linearAngle}, ${transparentColor}, rgba(0,0,0,0))`;
  } else {
    backgroundValue = color; // solid uses hex directly
  }

  const app = document.querySelector('.App');
  if (app) app.style.background = backgroundValue;
}

const updateSetting = (key, value) => {
  const updated = { ...settings, [key]: value };
  applySettings(updated);
  setSettings(updated);
};


  const resetSettings = () => {
    setSettings(savedSettings);
    applySettings(savedSettings);
  };

  const saveSettings = async () => {
    try {
      await callApi('settings/save/', 'POST', {
        category: 'display',
        settings,
      });

    //   console.log("Settings saved successfully");
      setSavedSettings(settings);
      onClose();
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

      {gradient === 'radial' && (
  <div className="display-setting">
    <label>Radial Position</label>
    <select
      value={settings.radialPosition}
      onChange={(e) => updateSetting('radialPosition', e.target.value)}
    >
      <option value="top">Top</option>
      <option value="center">Center</option>
      <option value="bottom">Bottom</option>
      <option value="left">Left</option>
      <option value="right">Right</option>
      <option value="top left">Top Left</option>
      <option value="top right">Top Right</option>
      <option value="bottom left">Bottom Left</option>
      <option value="bottom right">Bottom Right</option>
    </select>
  </div>
)}

{gradient === 'linear' && (
  <div className="display-setting">
    <label>Linear Angle</label>
    <div className="slider-wrapper">
      <input
        type="range"
        min="0"
        max="360"
        step="1"
        value={parseInt(settings.linearAngle)}
        onChange={(e) => updateSetting('linearAngle', `${e.target.value}deg`)}
      />
      <span className="slider-value">{parseInt(settings.linearAngle)}°</span>
    </div>
  </div>
)}



      <div className="display-setting">
        <label>Primary Gradient Color</label>
        <div className="color-swatch-grid">
          {[
            '#5387be', '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2',
            '#9d4edd', '#e63946', '#f1fa8c', '#00b4d8', '#ff61a6'
          ].map(presetColor => (
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
          <span className="slider-value">{(transparency ?? 0.15).toFixed(2)}</span>
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
          <span className="slider-value">{parseFloat(fontSize || '1').toFixed(1)}em</span>
        </div>
      </div>

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

      <div className="display-setting">
        <label>Padding</label>
        <select value={padding} onChange={(e) => updateSetting('padding', e.target.value)}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

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

      <div className="button-row">
        <button onClick={resetSettings}>Reset</button>
        <button onClick={saveSettings}>Save</button>
      </div>
    </div>
  );
};

export default DisplayMenu;
