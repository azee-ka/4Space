import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../utils/useApi';
import { useAuth } from '../hooks/useAuth';

const defaultSettings = {
    gradient: 'radial',
    color: '#5387be',
    fontSize: '1em',
    themeMode: 'dark',    // 'dark', 'light', or 'system'
    backgroundColor: 'black', // for solid background, fallback, and dark mode base
    padding: 'medium',
    animations: true,
    transparency: 0.15,
    radialPosition: 'top',
    linearAngle: '135deg',
};

const DisplaySettingsContext = createContext();

const getEffectiveTheme = (themeMode) => {
    if (themeMode === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeMode;
};

const colorToRgba = (hex, alpha) => {
    if (!hex || typeof hex !== 'string' || hex.length !== 7) hex = '#5387be';
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const DisplaySettingsProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [settings, setSettings] = useState(defaultSettings);
    const [loaded, setLoaded] = useState(false);
    const { callApi } = useApi();

    // On mount: set default gradient + black background (covers pre-login, loading, etc.)
    useEffect(() => {
        const app = document.querySelector('.App');
        if (!app) return;
        const { gradient, color, transparency, radialPosition, linearAngle, backgroundColor } = defaultSettings;

        let background = backgroundColor || 'black';
        if (gradient === 'radial' || gradient === 'linear') {
            const rgba = colorToRgba(color, transparency);
            const gradientCss =
                gradient === 'radial'
                    ? `radial-gradient(circle at ${radialPosition}, ${rgba}, rgba(0,0,0,0))`
                    : `linear-gradient(${linearAngle}, ${rgba}, rgba(0,0,0,0))`;
            background = `${gradientCss}, ${backgroundColor || 'black'}`;
        }
        app.style.background = background;
        app.style.backgroundColor = backgroundColor || 'black';
    }, []);

    // Apply display settings to DOM/CSS variables
    const apply = (s = settings) => {
        const {
            fontSize,
            color,
            themeMode,
            gradient,
            transparency,
            radialPosition,
            linearAngle,
            backgroundColor,
        } = s;

        document.documentElement.style.setProperty('--base-font-size', fontSize);
        document.documentElement.style.setProperty('--theme-color', color);

        const actualTheme = getEffectiveTheme(themeMode);
        document.documentElement.setAttribute('data-theme', actualTheme);
        document.body.className = actualTheme;

        const app = document.querySelector('.App');
        if (!app) return;

        // Light mode: solid gray/white only
        if (actualTheme === 'light') {
            app.style.background = 'rgb(238, 238, 238)';
            app.style.backgroundColor = 'rgb(238, 238, 238)';
            return;
        }

        // Dark mode: always have fallback solid color
        app.style.backgroundColor = backgroundColor || 'black';

        // If gradient is specified, use it on top of background color
        if (gradient === 'radial' || gradient === 'linear') {
            const rgba = colorToRgba(color, transparency);
            const gradientCss =
                gradient === 'radial'
                    ? `radial-gradient(circle at ${radialPosition}, ${rgba}, rgba(0,0,0,0))`
                    : `linear-gradient(${linearAngle}, ${rgba}, rgba(0,0,0,0))`;
            app.style.background = `${gradientCss}, ${backgroundColor || 'black'}`;
        } else {
            // No gradient: just solid background color
            app.style.background = backgroundColor || 'black';
        }
    };

    // Load from backend or use default on fail
    useEffect(() => {
        const load = async () => {
            try {
                const res = await callApi('settings/load/?category=display');
                const raw = res.data.reduce((acc, item) => {
                    acc[item.key] = item.value;
                    return acc;
                }, {});
                let merged = { ...defaultSettings, ...raw };
                // Migrate old darkMode to themeMode if needed
                if (!('themeMode' in merged)) {
                    if (merged.darkMode === true) merged.themeMode = 'dark';
                    else if (merged.darkMode === false) merged.themeMode = 'light';
                    else merged.themeMode = 'system';
                }
                setSettings(merged);
                apply(merged);
            } catch (e) {
                console.warn('Failed to load display settings. Using defaults.');
                setSettings(defaultSettings);
                apply(defaultSettings);
            } finally {
                setLoaded(true);
            }
        };
        if (isAuthenticated) load();
        // eslint-disable-next-line
    }, [isAuthenticated]);

    // Also re-apply theme when system changes (for system mode)
    useEffect(() => {
        if (settings.themeMode === 'system') {
            const onChange = () => apply(settings);
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onChange);
            return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', onChange);
        }
        // eslint-disable-next-line
    }, [settings.themeMode, settings.color, settings.gradient, settings.transparency, settings.radialPosition, settings.linearAngle, settings.fontSize]);

    return (
        <DisplaySettingsContext.Provider value={{ settings, setSettings, apply, loaded }}>
            {children}
        </DisplaySettingsContext.Provider>
    );
};

export const useDisplaySettings = () => useContext(DisplaySettingsContext);
