// context/DisplaySettingsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../utils/useApi';
import { useAuth } from '../hooks/useAuth';

// Export this so DisplayMenu can reuse it
export const defaultSettings = {
  gradient: 'radial',
  gradientColors: [{ color: '#5387be', alpha: 0.1 }],   // 0.20 alpha
  fontSize: '1em',
  themeMode: 'dark',         // always dark until backend says otherwise
  backgroundColor: 'black',
  padding: 'medium',
  animations: true,
  radialPosition: '50% 0%',
  linearAngle: '135deg',
};

const DisplaySettingsContext = createContext();

const getEffectiveTheme = (themeMode) =>
  themeMode === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : themeMode;

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
    } = s;

    // base font & data-theme
    document.documentElement.style.setProperty('--base-font-size', fontSize);
    const theme = getEffectiveTheme(themeMode);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme;

    // light mode is just a solid
    if (theme === 'light') {
      document.body.style.background = '#eeeeee';
      document.body.style.backgroundColor = '#eeeeee';
      return;
    }

    // build gradient
    const stops = gradientColors.map(rgba).join(', ');
    const fullStops = `${stops}, rgba(0,0,0,0)`;
    const grad =
      gradient === 'radial'
        ? `radial-gradient(circle at ${radialPosition}, ${fullStops})`
        : `linear-gradient(${linearAngle}, ${fullStops})`;

    // apply both gradient layer + solid fallback
    document.body.style.background = `${grad}, ${backgroundColor}`;
    document.body.style.backgroundColor = backgroundColor;
  };

  // 1) on mount, immediately apply dark defaults and mark loaded
  useEffect(() => {
    apply(defaultSettings);
    setLoaded(true);
  }, []);

  // 2) if authenticated, load real settings and re-apply
  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
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
        // on error, stick with defaults
        setSettings(defaultSettings);
        apply(defaultSettings);
      }
    };
    load();
  }, [isAuthenticated]);

  // 3) respond to system theme changes if in “system” mode
  useEffect(() => {
    if (settings.themeMode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply(settings);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [settings]);

  return (
    <DisplaySettingsContext.Provider
      value={{ settings, setSettings, apply, loaded }}
    >
      {children}
    </DisplaySettingsContext.Provider>
  );
};

export const useDisplaySettings = () => useContext(DisplaySettingsContext);
