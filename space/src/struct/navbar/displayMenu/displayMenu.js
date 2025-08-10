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

const MAX_COLOR_COUNT = 4;

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const getNextTheme = (current) => {
  const idx = themeOptions.findIndex(o => o.value === current);
  return themeOptions[(idx + 1) % themeOptions.length];
};

/* -------------------- Guest driver (localStorage) -------------------- */

const GUEST_STORAGE_KEY = 'displaySettings:guest';

// Inject / update a style tag for global display effects (guest mode)
const setGuestEffectsStyle = (settings, { selector = 'html' } = {}) => {
  const id = 'guest-display-fx';
  let tag = document.getElementById(id);
  if (!tag) {
    tag = document.createElement('style');
    tag.id = id;
    document.head.appendChild(tag);
  }

  const b = Number.isFinite(+settings.brightness) ? +settings.brightness : 1;
  const c = Number.isFinite(+settings.contrast)   ? +settings.contrast   : 1;
  const s = Number.isFinite(+settings.saturation) ? +settings.saturation : 1;

  tag.textContent = `
    ${selector} {
      filter: brightness(${b}) contrast(${c}) saturate(${s});
    }
  `;
};

const computeGradient = (s, baseDefaults = defaultSettings) => {
  const toRgbaLocal = (hex, a = 1) => {
    try {
      const h = hex.replace('#', '');
      const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const n = parseInt(full, 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    } catch {
      return `rgba(124,58,237,${a})`;
    }
  };

  const src = (s.gradientColors?.length ? s.gradientColors : baseDefaults.gradientColors).slice(0, 4);
  const cols = src.map(gc => toRgbaLocal(gc.color, gc.alpha));
  const c0 = cols[0] ?? 'rgba(124,58,237,0.35)';
  const c1 = cols[1] ?? c0;
  const c2 = cols[2] ?? c1;
  const c3 = cols[3] ?? 'rgba(0,0,0,0)';

  if (s.gradient === 'linear') {
    const angle = s.linearAngle || '135deg';
    return `linear-gradient(${angle}, ${c0} 0%, ${c1} 35%, ${c2} 65%, ${c3} 100%)`;
  }

  const fallbackPos = baseDefaults.radialPosition || '50% 0%';
  const [px, py] = (s.radialPosition || fallbackPos).split(/\s+/);
  const pos = `${px || '50%'} ${py || '0%'}`;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const sxPct = clamp(
    Number.isFinite(+s.radialSizeX) ? +s.radialSizeX : (baseDefaults.radialSizeX ?? 85),
    30,
    120
  );
  const syPct = clamp(
    Number.isFinite(+s.radialSizeY) ? +s.radialSizeY : (baseDefaults.radialSizeY ?? 70),
    30,
    120
  );

  const sx = `${sxPct}%`;
  const sy = `${syPct}%`;

  return `radial-gradient(${sx} ${sy} at ${pos},
    ${c0} 0%,
    ${c0} 18%,
    ${c1} 28%,
    ${c2} 48%,
    rgba(0,0,0,0) 68%)`;
};

const applyGuest = (settings, baseDefaults = defaultSettings) => {
  const root = document.documentElement;
  root.style.setProperty('--global-gradient', computeGradient(settings, baseDefaults));

  const effectiveTheme =
    settings.themeMode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : (settings.themeMode || 'system');

  root.setAttribute('data-theme', effectiveTheme);

  setGuestEffectsStyle(settings, { selector: 'html' });

  try {
    window.dispatchEvent(new CustomEvent('guestDisplaySettingsChanged', { detail: settings }));
  } catch {}
};

function useGuestDisplaySettings(baseDefaults = defaultSettings) {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      return raw ? { ...baseDefaults, ...JSON.parse(raw) } : { ...baseDefaults };
    } catch {
      return { ...baseDefaults };
    }
  });

  const loaded = true;

  const apply = (next) => {
    applyGuest(next || settings, baseDefaults);
  };

  const saveSettings = async (s) => {
    const next = s || settings;
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(next));
    applyGuest(next, baseDefaults);
  };

  // Apply once on mount to sync CSS vars and filter
  useEffect(() => {
    applyGuest(settings, baseDefaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { settings, setSettings, apply, loaded, saveSettings };
}

/* ---------------------- Display Menu Panel ---------------------- */

function DisplayMenuPanel({ onClose, guestMode = false, defaultsOverride }) {
  const baseDefaults = defaultsOverride || defaultSettings;

  // Call BOTH hooks every render; pick the driver after to satisfy Rules of Hooks
  const ctxDriver   = useDisplaySettings();
  const guestDriver = useGuestDisplaySettings(baseDefaults);

  const driver = guestMode ? guestDriver : ctxDriver;
  const { settings, setSettings, apply, loaded, saveSettings } = driver;

  const [savedSettings, setSavedSettings] = useState(baseDefaults);
  const [radialCoord, setRadialCoord] = useState({ x: 50, y: 0 });
  const [colorCount, setColorCount] = useState(1);

  const containerRef = useRef(null);

useEffect(() => {
  if (!loaded) return;

  setSavedSettings(settings);

  // Guard gradientColors
  const safeLen = Array.isArray(settings?.gradientColors)
    ? settings.gradientColors.length
    : (baseDefaults?.gradientColors?.length || 1);
  setColorCount(Math.min(MAX_COLOR_COUNT, Math.max(1, safeLen)));

  // Guard radialPosition
  const posStr = String(
    settings?.radialPosition ??
    baseDefaults?.radialPosition ??
    '50% 0%'
  );
  const [px = '50%', py = '0%'] = posStr.split(/\s+/);
  const x = parseFloat(px);
  const y = parseFloat(py);
  if (!Number.isNaN(x) && !Number.isNaN(y)) {
    setRadialCoord({ x, y });
  }
}, [loaded, settings, baseDefaults]);

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    apply(next);
  };

  const updateColor = (i, prop, value) => {
    const arr = [...settings.gradientColors];
    while (arr.length < colorCount) arr.push({ ...baseDefaults.gradientColors[0] });
    arr[i] = { ...arr[i], [prop]: value };
    update('gradientColors', arr);
  };

  const handleCount = e => {
    let n = Math.min(MAX_COLOR_COUNT, Math.max(1, parseInt(e.target.value, 10) || 1));
    setColorCount(n);
    const arr = settings.gradientColors.slice(0, n);
    while (arr.length < n) arr.push({ ...baseDefaults.gradientColors[0] });
    update('gradientColors', arr);
  };

  const reset  = () => { setSettings(savedSettings); apply(savedSettings); };
  const revert = () => { setColorCount(baseDefaults.gradientColors.length); setSettings(baseDefaults); apply(baseDefaults); };

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
                type="number" min="1" max={MAX_COLOR_COUNT}
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
                    type="range" min="0" max="200" step="1"
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
                    type="range" min="0" max="200" step="1"
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
                          color={settings.gradientColors[idx]?.color ?? baseDefaults.gradientColors[0].color}
                          onChange={newColor => updateColor(idx, 'color', newColor)}
                        />
                        <button className="close-picker">Close</button>
                      </div>
                    </DropdownButton>
                  ) : (
                    <div
                      key={si}
                      className={`color-swatch ${settings.gradientColors[idx]?.color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => updateColor(idx, 'color', c)}
                    />
                  )
                )}
              </div>
              <div className="slider-wrapper">
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={settings.gradientColors[idx]?.alpha ?? baseDefaults.gradientColors[0].alpha}
                  onChange={e => updateColor(idx, 'alpha', parseFloat(e.target.value))}
                />
                <span className="slider-value">
                  {(settings.gradientColors[idx]?.alpha ?? baseDefaults.gradientColors[0].alpha).toFixed(2)}
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

      {/* Font Size */}
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

/* ---------------------- Dropdown Wrapper ---------------------- */

export default function DisplayMenu({ toggleContent, placement = 'bottom-end', boundaryRef, guestMode = false, defaultsOverride }) {
  return (
    <DropdownButton
      toggleContent={toggleContent}
      placement={placement}
      boundaryRef={boundaryRef}
    >
      {({ closeDropdown }) => (
        <DisplayMenuPanel onClose={closeDropdown} guestMode={guestMode} defaultsOverride={defaultsOverride} />
      )}
    </DropdownButton>
  );
}