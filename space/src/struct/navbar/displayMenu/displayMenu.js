// components/displayMenu/DisplayMenu.js
import React, { useEffect, useRef, useState } from 'react';
import './displayMenu.css';
import { useDisplaySettings, defaultSettings } from '../../../context/DisplaySettingsContext';
import { SystemIcon, SunIcon, MoonIcon } from '../../../utils/CustomIcons';
import { HexColorPicker } from 'react-colorful';
import DropdownButton from '../../../utils/popperButton/DropdownButton';

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
  const { settings, setSettings, apply, loaded, saveSettings } = useDisplaySettings();

  const [savedSettings, setSavedSettings] = useState(defaultSettings);
  const [radialCoord, setRadialCoord]   = useState({ x: 50, y: 0 });
  const [colorCount, setColorCount]     = useState(1);

  const containerRef = useRef(null);

  useEffect(() => {
    if (!loaded) return;
    setSavedSettings(settings);
    setColorCount(Math.min(4, Math.max(1, settings.gradientColors.length)));
    const [x, y] = settings.radialPosition.split(' ').map(parseFloat);
    if (!isNaN(x) && !isNaN(y)) setRadialCoord({ x, y });
  }, [loaded, settings]);

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    apply(next);
  };

  const updateColor = (i, prop, value) => {
    const arr = [...settings.gradientColors];
    while (arr.length < colorCount) arr.push({ ...defaultSettings.gradientColors[0] });
    arr[i] = { ...arr[i], [prop]: value };
    update('gradientColors', arr);
  };

  const handleCount = e => {
    let n = Math.min(4, Math.max(1, parseInt(e.target.value, 10) || 1));
    setColorCount(n);
    const arr = settings.gradientColors.slice(0, n);
    while (arr.length < n) arr.push({ ...defaultSettings.gradientColors[0] });
    update('gradientColors', arr);
  };

  const reset  = () => { setSettings(savedSettings); apply(savedSettings); };
  const revert = () => { setColorCount(defaultSettings.gradientColors.length); setSettings(defaultSettings); apply(defaultSettings); };

  // ---- UPDATED: Use abstracted saveSettings ----
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveSettings(settings);
      onClose();
    } catch (err) {
      setSaveError('Failed to save display settings');
      // Optionally: Show toast here
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="display-settings-container">Loading…</div>;

  const {
    gradient, fontSize, padding, animations,
    radialPosition, linearAngle, themeMode = 'system',
    gradientColors,
    brightness, contrast, saturation,
    radialSizeX, radialSizeY,
  } = settings;

  const { label: themeLabel, icon: ThemeIcon } =
    themeOptions.find(o => o.value === themeMode) || themeOptions[0];
  const effectiveTheme = themeMode === 'system' ? getSystemTheme() : themeMode;
  const isLight = effectiveTheme === 'light';

  return (
    <div
      ref={containerRef}
      className="display-settings-container"
      onClick={e => e.stopPropagation()}
    >
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

      {saveError && (
        <div className="display-error-msg">
          {saveError}
        </div>
      )}

      {!isLight && (
        <>
          {/* Gradient style & count */}
          <div className="display-setting gradient-row">
            <div className="field gradient-style-field">
              <label>Gradient Style</label>
              <select value={gradient} onChange={e => update('gradient', e.target.value)}>
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

          {/* Radial settings */}
          {gradient === 'radial' && (
            <>
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
                    style={{ left: `${radialCoord.x}%`, top: `${radialCoord.y}%` }}
                  />
                </div>
              </div>

              <div className="display-setting">
                <label>Radial Size X</label>
                <div className="slider-wrapper">
                  <input
                    type="range" min="50" max="200" step="1"
                    value={radialSizeX}
                    onChange={e => update('radialSizeX', parseFloat(e.target.value))}
                  />
                  <span className="slider-value">{radialSizeX}%</span>
                </div>
              </div>

              <div className="display-setting">
                <label>Radial Size Y</label>
                <div className="slider-wrapper">
                  <input
                    type="range" min="50" max="200" step="1"
                    value={radialSizeY}
                    onChange={e => update('radialSizeY', parseFloat(e.target.value))}
                  />
                  <span className="slider-value">{radialSizeY}%</span>
                </div>
              </div>
            </>
          )}

          {/* Linear angle */}
          {gradient === 'linear' && (
            <div className="display-setting">
              <label>Linear Angle</label>
              <div className="slider-wrapper">
                <input
                  type="range" min="0" max="360"
                  value={parseInt(linearAngle)}
                  onChange={e => update('linearAngle', `${e.target.value}deg`)}
                />
                <span className="slider-value">{parseInt(linearAngle)}°</span>
              </div>
            </div>
          )}

          {/* Color swatches */}
          {Array.from({ length: colorCount }).map((_, idx) => (
            <div key={idx} className="display-setting gradient-color-group">
              <div className="color-swatch-grid">
                {presetColors.map((c, si) =>
                  c === 'picker' ? (
                    <DropdownButton
                      key={si}
                      placement="bottom-start"
                      boundaryRef={containerRef}
                      toggleContent={
                        <div className="color-swatch">
                          <span className="picker-icon">🎨</span>
                        </div>
                      }
                    >
                      <div className="custom-color-picker" onClick={e => e.stopPropagation()}>
                        <HexColorPicker
                          color={gradientColors[idx]?.color ?? defaultSettings.gradientColors[0].color}
                          onChange={newColor => updateColor(idx, 'color', newColor)}
                        />
                        <button className="close-picker">Close</button>
                      </div>
                    </DropdownButton>
                  ) : (
                    <div
                      key={si}
                      className={`color-swatch ${gradientColors[idx]?.color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => updateColor(idx, 'color', c)}
                    />
                  )
                )}
              </div>
              <div className="slider-wrapper">
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={gradientColors[idx]?.alpha ?? defaultSettings.gradientColors[0].alpha}
                  onChange={e => updateColor(idx, 'alpha', parseFloat(e.target.value))}
                />
                <span className="slider-value">
                  {(gradientColors[idx]?.alpha ?? defaultSettings.gradientColors[0].alpha).toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          {/* Image Effects */}
          <div className="effects-group">
            <h4>Image Effects</h4>
            <div className="display-setting">
              <label>Brightness</label>
              <div className="slider-wrapper">
                <input
                  type="range" min="0.5" max="1.5" step="0.01"
                  value={brightness}
                  onChange={e => update('brightness', parseFloat(e.target.value))}
                />
                <span className="slider-value">{brightness.toFixed(2)}</span>
              </div>
            </div>
            <div className="display-setting">
              <label>Contrast</label>
              <div className="slider-wrapper">
                <input
                  type="range" min="0.5" max="1.5" step="0.01"
                  value={contrast}
                  onChange={e => update('contrast', parseFloat(e.target.value))}
                />
                <span className="slider-value">{contrast.toFixed(2)}</span>
              </div>
            </div>
            <div className="display-setting">
              <label>Saturation</label>
              <div className="slider-wrapper">
                <input
                  type="range" min="0.5" max="2.0" step="0.01"
                  value={saturation}
                  onChange={e => update('saturation', parseFloat(e.target.value))}
                />
                <span className="slider-value">{saturation.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Font Size (SMOOTH SLIDER!) */}
      <div className="display-setting">
        <label>Font Size</label>
        <div className="slider-wrapper">
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.01"
            value={parseFloat(fontSize)}
            onChange={e => update('fontSize', `${e.target.value}em`)}
          />
          <span className="slider-value">
            {parseFloat(fontSize).toFixed(2)} em
          </span>
        </div>
      </div>

      {/* Padding */}
      <div className="display-setting">
        <label>Padding</label>
        <select value={padding} onChange={e => update('padding', e.target.value)}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
      
      {/* Animations */}
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

      {/* Buttons */}
      <div className="button-row">
        <div className="inline-buttons">
          <button onClick={reset} disabled={saving}>Reset</button>
          <button onClick={revert} disabled={saving}>Revert to Default</button>
        </div>
        <button className="save-button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
