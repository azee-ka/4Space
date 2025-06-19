import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { fetchDisplaySettings, saveDisplaySettings } from '../services/displaySettings';
import { DISPLAY_SETTINGS } from '../services/queryKeys';

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
  brightness: 1,
  contrast: 1,
  saturation: 1,
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
  const queryClient = useQueryClient();

  // Load settings with React Query
  const {
    data: loadedSettings,
    isLoading,
    isSuccess,
    isError,
    refetch,
  } = useQuery({
    queryKey: DISPLAY_SETTINGS,
    queryFn: fetchDisplaySettings,
    enabled: !!isAuthenticated,
    staleTime: 60_000,
  });

  // Local state for theme
  const [settings, setSettings] = useState(defaultSettings);

  // Sync loaded settings into local state when loaded
  useEffect(() => {
    if (isSuccess && loadedSettings) {
      const merged = {
        ...defaultSettings,
        ...loadedSettings,
        gradientColors: loadedSettings.gradientColors || defaultSettings.gradientColors,
      };
      setSettings(merged);
      apply(merged);
    }
  // eslint-disable-next-line
  }, [isSuccess, loadedSettings]);

  // Always apply theme when settings change
  const apply = useCallback((s = settings) => {
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

    document.documentElement.style.setProperty('--base-font-size', fontSize);

    const theme = getEffectiveTheme(themeMode);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme;

    if (theme === 'light') {
      document.documentElement.style.setProperty('--display-bg', '#eeeeee');
      document.documentElement.style.setProperty('--display-filter', '');
      return;
    }

    const stops     = gradientColors.map(rgba).join(', ');
    const fullStops = `${stops}, rgba(0,0,0,0)`;
    const grad = gradient === 'radial'
      ? `radial-gradient(ellipse ${radialSizeX}% ${radialSizeY}% at ${radialPosition}, ${fullStops})`
      : `linear-gradient(${linearAngle}, ${fullStops})`;

    document.documentElement.style.setProperty('--display-bg', `${grad}, ${backgroundColor}`);
    document.documentElement.style.setProperty(
      '--display-filter',
      `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
    );
  }, [settings]);

  // Apply default at startup
  useEffect(() => {
    apply(defaultSettings);
    // setLoaded(true); // Not needed, react-query isSuccess is your 'loaded'
  }, []);

  // Watch system theme if needed
  useEffect(() => {
    if (settings.themeMode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply(settings);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [settings, apply]);

  // React Query save mutation
  const saveSettingsMutation = useMutation({
    mutationFn: saveDisplaySettings,
    onSuccess: () => {
      queryClient.invalidateQueries(DISPLAY_SETTINGS);
    },
    onError: (err) => {
      // You can add error reporting here if you want
      console.error('Failed to save display settings', err);
    }
  });

  // This is the abstracted save function you want to use everywhere
  const saveSettings = async (settings) => {
    await saveSettingsMutation.mutateAsync(settings);
  };

  return (
    <DisplaySettingsContext.Provider
      value={{
        settings,
        setSettings,
        apply,
        loaded: isSuccess && !!loadedSettings,
        refetchSettings: refetch,
        saveSettings,
        isLoading,
        isError,
      }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};

export const useDisplaySettings = () => useContext(DisplaySettingsContext);
