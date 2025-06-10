// components/displayMenu/DisplayMenu.js
import React, { useEffect, useState } from 'react';
import './displayMenu.css';
import { useDisplaySettings, defaultSettings } from '../../../context/DisplaySettingsContext';
import useApi from '../../../utils/useApi';
import { SystemIcon, SunIcon, MoonIcon } from '../../../utils/CustomIcons';

const themeOptions = [
  { value: 'system', label: 'System', icon: SystemIcon },
  { value: 'light',  label: 'Light',  icon: SunIcon    },
  { value: 'dark',   label: 'Dark',   icon: MoonIcon   },
];

const presetColors = [
  '#5387be','#ff6b6b','#ffd166','#06d6a0',
  '#118ab2','#9d4edd','#e63946','#f1fa8c',
  '#00b4d8','#ff61a6','picker'
];

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const getNextTheme = (current) => {
  const idx = themeOptions.findIndex(o => o.value === current);
  return themeOptions[(idx + 1) % themeOptions.length];
};

export default function DisplayMenu({ onClose }) {
  const { settings, setSettings, apply, loaded } = useDisplaySettings();
  const { callApi } = useApi();

  const [savedSettings, setSavedSettings] = useState(defaultSettings);
  const [radialCoord,    setRadialCoord] = useState({ x: 50, y: 0 });
  const [colorCount,     setColorCount]  = useState(1);

  // sync local UI state once context is ready
  useEffect(() => {
    if (!loaded) return;
    setSavedSettings(settings);
    const len = Math.min(4, Math.max(1, (settings.gradientColors || []).length));
    setColorCount(len);
    const [x, y] = settings.radialPosition.split(' ').map(str => parseFloat(str));
    if (!isNaN(x) && !isNaN(y)) setRadialCoord({ x, y });
  }, [loaded, settings]);

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    apply(next);
  };

  const updateColor = (i, prop, value) => {
    const arr = [...(settings.gradientColors || [])];
    while (arr.length < colorCount) arr.push({ ...defaultSettings.gradientColors[0] });
    arr[i] = { ...arr[i], [prop]: value };
    update('gradientColors', arr);
  };

  const handleCount = e => {
    let n = Math.min(4, Math.max(1, parseInt(e.target.value, 10) || 1));
    setColorCount(n);
    const arr = (settings.gradientColors || []).slice(0, n);
    while (arr.length < n) arr.push({ ...defaultSettings.gradientColors[0] });
    update('gradientColors', arr);
  };

  const reset = () => {
    setSettings(savedSettings);
    apply(savedSettings);
  };

  const revert = () => {
    setColorCount(defaultSettings.gradientColors.length);
    setSettings(defaultSettings);
    apply(defaultSettings);
  };

  const save = async () => {
    try {
      await callApi('settings/save/', 'POST', {
        category: 'display',
        settings
      });
      onClose();
    } catch (err) {
      console.error('Failed to save display settings', err);
    }
  };

  if (!loaded) {
    return <div className="display-settings-container">Loading…</div>;
  }

  const {
    gradient, fontSize, padding, animations,
    radialPosition, linearAngle, themeMode = 'system',
    gradientColors = []
  } = settings;

  const { label: themeLabel, icon: ThemeIcon } =
    themeOptions.find(o => o.value === themeMode) || themeOptions[0];

  const effectiveTheme = themeMode === 'system' ? getSystemTheme() : themeMode;
  const isLight = effectiveTheme === 'light';

  return (
    <div className="display-settings-container" onClick={e => e.stopPropagation()}>
      <div className="settings-title-row">
        <h3>Display Settings</h3>
        <button
          className="theme-cycle-btn"
          onClick={() => update('themeMode', getNextTheme(themeMode).value)}
          title={`Theme: ${themeLabel}`}
        >
          <ThemeIcon filled />
        </button>
      </div>

      {!isLight && (
        <>
          <div className="display-setting gradient-row">
            <div className="field gradient-style-field">
              <label>Gradient Style</label>
              <select
                value={gradient}
                onChange={e => update('gradient', e.target.value)}
              >
                <option value="radial">Radial</option>
                <option value="linear">Linear</option>
              </select>
            </div>

            <div className="field">
              <label>Color Count</label>
              <input
                type="number" min="1" max="4"
                value={colorCount}
                onChange={handleCount}
                className="count-input"
              />
            </div>
          </div>

          {gradient === 'radial' && (
            <div className="display-setting">
              <label>Radial Position</label>
              <div
                className="radial-pad"
                onMouseDown={e => {
                  const pad = e.currentTarget;
                  const move = ev => {
                    const { left, top, width, height } = pad.getBoundingClientRect();
                    const x = Math.max(0, Math.min(100, ((ev.clientX - left) / width) * 100));
                    const y = Math.max(0, Math.min(100, ((ev.clientY - top) / height) * 100));
                    setRadialCoord({ x, y });
                    update('radialPosition', `${x.toFixed(0)}% ${y.toFixed(0)}%`);
                  };
                  const up = () => {
                    document.removeEventListener('mousemove', move);
                    document.removeEventListener('mouseup', up);
                  };
                  document.addEventListener('mousemove', move);
                  document.addEventListener('mouseup', up);
                  move(e);
                }}
              >
                <div
                  className="radial-indicator"
                  style={{
                    left:  `${radialCoord.x}%`,
                    top:   `${radialCoord.y}%`
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
                  type="range" min="0" max="360"
                  value={parseInt(linearAngle)}
                  onChange={e => update('linearAngle', `${e.target.value}deg`)}
                />
                <span className="slider-value">
                  {parseInt(linearAngle)}°
                </span>
              </div>
            </div>
          )}

          {Array.from({ length: colorCount }).map((_, i) => (
            <div key={i} className="display-setting gradient-color-group">
              <div className="color-swatch-grid">
                {presetColors.map((c, si) => (
                  <div
                    key={si}
                    className={
                      `color-swatch ${
                        c !== 'picker' && gradientColors[i]?.color === c
                          ? 'active'
                          : ''
                      }`
                    }
                    onClick={() => {
                      if (c === 'picker') {
                        document.getElementById(`picker-${i}`).click();
                      } else {
                        updateColor(i, 'color', c);
                      }
                    }}
                    style={{ backgroundColor: c === 'picker' ? 'transparent' : c }}
                  >
                    {c === 'picker' && <span className="picker-icon">🎨</span>}
                  </div>
                ))}
                <input
                  id={`picker-${i}`}
                  type="color"
                  className="color-picker-popup"
                  value={gradientColors[i]?.color || defaultSettings.gradientColors[0].color}
                  onChange={e => updateColor(i, 'color', e.target.value)}
                />
              </div>
              <div className="slider-wrapper">
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={gradientColors[i]?.alpha ?? defaultSettings.gradientColors[0].alpha}
                  onChange={e => updateColor(i, 'alpha', parseFloat(e.target.value))}
                />
                <span className="slider-value">
                  {(gradientColors[i]?.alpha ?? defaultSettings.gradientColors[0].alpha).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="display-setting">
        <label>Font Size</label>
        <div className="slider-wrapper">
          <input
            type="range" min="0.8" max="1.5" step="0.1"
            value={parseFloat(fontSize)}
            onChange={e => update('fontSize', `${e.target.value}em`)}
          />
          <span className="slider-value">
            {parseFloat(fontSize).toFixed(1)}em
          </span>
        </div>
      </div>

      <div className="display-setting">
        <label>Padding</label>
        <select
          value={padding}
          onChange={e => update('padding', e.target.value)}
        >
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
            onChange={() => update('animations', !animations)}
          />
          <span className="display-toggle-slider" />
        </label>
      </div>

      <div className="button-row">
        <div className="inline-buttons">
          <button onClick={reset}>Reset</button>
          <button onClick={revert}>Revert to Default</button>
        </div>
        <button className="save-button" onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}
