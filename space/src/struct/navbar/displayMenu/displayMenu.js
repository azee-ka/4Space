import { useEffect, useState } from 'react';
import './displayMenu.css';
import { useDisplaySettings } from '../../../context/DisplaySettingsContext';
import useApi from '../../../utils/useApi';
import { SystemIcon, SunIcon, MoonIcon } from '../../../utils/CustomIcons';

const themeOptions = [
  { value: 'system', label: 'System', icon: SystemIcon },
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
];

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const getNextTheme = (current) => {
  const idx = themeOptions.findIndex((opt) => opt.value === current);
  return themeOptions[(idx + 1) % themeOptions.length];
};

const getEffectiveTheme = (themeMode) => {
  if (themeMode === 'system') {
    return getSystemTheme();
  }
  return themeMode;
};

const DisplayMenu = ({ onClose }) => {
  const { settings, setSettings, apply, loaded } = useDisplaySettings();
  const { callApi } = useApi();
  const [savedSettings, setSavedSettings] = useState(null);
  const [radialCoord, setRadialCoord] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (loaded && settings) {
      setSavedSettings(settings);
      if (settings.radialPosition?.includes('%')) {
        const [x, y] = settings.radialPosition
          .split(' ')
          .map((val) => parseFloat(val));
        if (!isNaN(x) && !isNaN(y)) {
          setRadialCoord({ x, y });
        }
      }
    }
  }, [loaded, settings]);

  useEffect(() => {
    if (settings.themeMode === 'system') {
      const listener = () => {
        const systemTheme = getSystemTheme();
        document.documentElement.setAttribute('data-theme', systemTheme);
      };
      listener();
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', listener);
      return () =>
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .removeEventListener('change', listener);
    }
  }, [settings.themeMode]);

  if (!loaded || !settings) {
    return <div className="display-settings-container">Loading...</div>;
  }

  const updateSetting = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    apply(updated);
  };

  const handleThemeToggle = () => {
    const nextTheme = getNextTheme(settings.themeMode || 'system');
    const updated = { ...settings, themeMode: nextTheme.value };
    document.documentElement.setAttribute(
      'data-theme',
      getEffectiveTheme(nextTheme.value)
    );
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
      themeMode: 'dark',
      padding: 'medium',
      animations: true,
      transparency: 0.15,
      radialPosition: '50% 50%',
      linearAngle: '135deg',
    };
    setSettings(defaults);
    apply(defaults);
    document.documentElement.setAttribute('data-theme', 'dark');
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
      console.error('Error saving settings:', err);
    }
  };

  const {
    gradient,
    color,
    fontSize,
    padding,
    animations,
    transparency,
    radialPosition,
    linearAngle,
    themeMode = 'system',
  } = settings;

  const { label: themeLabel, icon: ThemeIcon } =
    themeOptions.find((opt) => opt.value === themeMode) || themeOptions[0];

  const effectiveTheme = getEffectiveTheme(themeMode);
  const isLight = effectiveTheme === 'light';

  return (
    <div className="display-settings-container" onClick={(e) => e.stopPropagation()}>
      <div className="settings-title-row">
        <h3>Display Settings</h3>
        <button
          className="theme-cycle-btn"
          onClick={handleThemeToggle}
          aria-label={`Toggle theme (${themeLabel})`}
          title={`Theme: ${themeLabel} (click to change)`}
        >
          <ThemeIcon filled />
        </button>
      </div>

      {!isLight && (
        <>
          <div className="display-setting">
            <label>Gradient Style</label>
            <select
              value={gradient}
              onChange={(e) => updateSetting('gradient', e.target.value)}
            >
              <option value="radial">Radial</option>
              <option value="linear">Linear</option>
            </select>
          </div>

          {gradient === 'radial' && (
  <div className="display-setting">
    <label>Radial Position</label>
    <div
      className="radial-pad"
      onMouseDown={(e) => {
        const pad = e.currentTarget;
        const move = (ev) => {
          const rect = pad.getBoundingClientRect();
          const x = Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100));
          const y = Math.min(100, Math.max(0, ((ev.clientY - rect.top) / rect.height) * 100));
          setRadialCoord({ x, y });
          updateSetting('radialPosition', `${x.toFixed(0)}% ${y.toFixed(0)}%`);
        };
        const up = () => {
          document.removeEventListener('mousemove', move);
          document.removeEventListener('mouseup', up);
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        move(e); // trigger once on initial click
      }}
    >
      <div
        className="radial-indicator"
        style={{
          left: `${radialCoord.x}%`,
          top: `${radialCoord.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
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
                '#5387be',
                '#ff6b6b',
                '#ffd166',
                '#06d6a0',
                '#118ab2',
                '#9d4edd',
                '#e63946',
                '#f1fa8c',
                '#00b4d8',
                '#ff61a6',
              ].map((preset) => (
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
                onChange={(e) =>
                  updateSetting('transparency', parseFloat(e.target.value))
                }
              />
              <span className="slider-value">{transparency.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}

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
            onChange={(e) =>
              updateSetting('fontSize', `${e.target.value}em`)
            }
          />
          <span className="slider-value">
            {parseFloat(fontSize).toFixed(1)}em
          </span>
        </div>
      </div>

      {/* Padding */}
      <div className="display-setting">
        <label>Padding</label>
        <select
          value={padding}
          onChange={(e) => updateSetting('padding', e.target.value)}
        >
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
        <button className="save-button" onClick={saveSettings}>
          Save
        </button>
      </div>
    </div>
  );
};

export default DisplayMenu;
