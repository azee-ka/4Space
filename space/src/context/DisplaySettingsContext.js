// context/DisplaySettingsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../utils/useApi';
import { useAuth } from '../hooks/useAuth';

export const defaultSettings = {
  gradient: 'radial',
  gradientColors: [{ color: '#5387be', alpha: 0.15 }],
  fontSize: '1em',
  themeMode: 'dark',
  backgroundColor: 'black',
  padding: 'medium',
  animations: true,
  radialPosition: '50% 0%',
  linearAngle: '135deg',
  // Filters
  brightness: 1,
  contrast:   1,
  saturation: 1,
  // Radial ellipse sizes
  radialSizeX: 100,
  radialSizeY: 100,
};

const DisplaySettingsContext = createContext();

const getEffectiveTheme = (mode) =>
  mode === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : mode;

const rgba = ({ color, alpha }) => {
  if (!/^#?[0-9A-Fa-f]{6}$/.test(color)) {
    return `rgba(83, 135, 190, ${alpha})`;
  }
  const hex = color.replace('#', '');
  const [r, g, b] = [0,2,4].map(i => parseInt(hex.slice(i, i+2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const DisplaySettingsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const { callApi } = useApi();

  const apply = (s = settings) => {
    const {
      fontSize,
      gradientColors = [],
      themeMode,
      gradient,
      radialPosition,
      linearAngle,
      backgroundColor,
      brightness,
      contrast,
      saturation,
      radialSizeX,
      radialSizeY,
    } = s;

    // Font size & theme attribute
    document.documentElement.style.setProperty('--base-font-size', fontSize);
    const theme = getEffectiveTheme(themeMode);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme;

    // Light mode: solid background, clear filters
    if (theme === 'light') {
      document.documentElement.style.setProperty('--display-bg', '#eeeeee');
      document.documentElement.style.setProperty('--display-filter', '');
      return;
    }

    // Build gradient stops
    const stops = gradientColors.map(rgba).join(', ');
    const fullStops = `${stops}, rgba(0,0,0,0)`;
    let grad;
    if (gradient === 'radial') {
      const shape = `ellipse ${radialSizeX}% ${radialSizeY}%`;
      grad = `radial-gradient(${shape} at ${radialPosition}, ${fullStops})`;
    } else {
      grad = `linear-gradient(${linearAngle}, ${fullStops})`;
    }

    document.documentElement.style.setProperty(
      '--display-bg',
      `${grad}, ${backgroundColor}`
    );
    document.documentElement.style.setProperty(
      '--display-filter',
      [
        `brightness(${brightness})`,
        `contrast(${contrast})`,
        `saturate(${saturation})`
      ].join(' ')
    );
  };

  useEffect(() => {
    apply(defaultSettings);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await callApi('settings/load/?category=display');
        const raw = res.data.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
        const merged = {
          ...defaultSettings,
          ...raw,
          gradientColors: raw.gradientColors || defaultSettings.gradientColors,
        };
        setSettings(merged);
        apply(merged);
      } catch {
        setSettings(defaultSettings);
        apply(defaultSettings);
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (settings.themeMode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply(settings);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [settings]);

  return (
    <DisplaySettingsContext.Provider value={{ settings, setSettings, apply, loaded }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};

export const useDisplaySettings = () => useContext(DisplaySettingsContext);
