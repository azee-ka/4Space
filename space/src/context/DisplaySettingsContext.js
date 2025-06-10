import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../utils/useApi';
import { useAuth } from '../hooks/useAuth';

const defaultSettings = {
  gradient: 'radial',
  gradientColors: [{ color: '#5387be', alpha: 0.23 }],
  fontSize: '1em',
  themeMode: 'dark',         // 'dark', 'light', or 'system'
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
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
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

    document.documentElement.style.setProperty('--base-font-size', fontSize);
    const theme = getEffectiveTheme(themeMode);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme;

    const app = document.querySelector('.App');
    if (!app) return;

    if (theme === 'light') {
      app.style.background = '#eeeeee';
      app.style.backgroundColor = '#eeeeee';
      return;
    }

    // build the <color-stop> list + explicit transparent fallback
    const stops = gradientColors.map(rgba).join(', ');
    const fullStops = `${stops}, rgba(0,0,0,0)`;

    const grad =
      gradient === 'radial'
        ? `radial-gradient(circle at ${radialPosition}, ${fullStops})`
        : `linear-gradient(${linearAngle}, ${fullStops})`;

    app.style.background = `${grad}, ${backgroundColor}`;
    app.style.backgroundColor = backgroundColor;
  };

  // on mount: set initial
  useEffect(() => {
    apply(defaultSettings);
  }, []);

  // load saved
  useEffect(() => {
    const load = async () => {
      try {
        const res = await callApi('settings/load/?category=display');
        const raw = res.data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
        const merged = {
          ...defaultSettings,
          ...raw,
          gradientColors: raw.gradientColors || defaultSettings.gradientColors,
        };
        setSettings(merged);
        apply(merged);
      } catch (e) {
        setSettings(defaultSettings);
        apply(defaultSettings);
      } finally {
        setLoaded(true);
      }
    };
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  // watch for system theme changes
  useEffect(() => {
    if (settings.themeMode === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply(settings);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
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
