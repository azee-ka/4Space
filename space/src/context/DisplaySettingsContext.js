import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../utils/useApi';
import { useAuth } from '../hooks/useAuth';

const defaultSettings = {
    gradient: 'radial',
    color: '#5387be',
    fontSize: '1em',
    themeMode: 'dark',    // 'dark', 'light', or 'system'
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

export const DisplaySettingsProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [settings, setSettings] = useState(defaultSettings);
    const [loaded, setLoaded] = useState(false);
    const { callApi } = useApi();

    // Convert hex color to rgba string with alpha
    const colorToRgba = (hex, alpha) => {
        if (!hex || typeof hex !== 'string' || hex.length !== 7) hex = '#5387be';
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

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
        } = s;

        document.documentElement.style.setProperty('--base-font-size', fontSize);
        document.documentElement.style.setProperty('--theme-color', color);

        const actualTheme = getEffectiveTheme(themeMode);
        document.documentElement.setAttribute('data-theme', actualTheme);
        document.body.className = actualTheme;

        const app = document.querySelector('.App');

        // For light mode: just a plain white background
        if (actualTheme === 'light') {
            if (app) app.style.background = 'rgb(238, 238, 238)';
            return;
        }
        // For dark mode: use gradient/color as normal
        const rgba = colorToRgba(color, transparency);
        const gradientCss =
            gradient === 'radial'
                ? `radial-gradient(circle at ${radialPosition}, ${rgba}, rgba(0, 0, 0, 0))`
                : gradient === 'linear'
                    ? `linear-gradient(${linearAngle}, ${rgba}, rgba(0, 0, 0, 0))`
                    : color;
        if (app) app.style.background = `${gradientCss}, black`;
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
