import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../utils/useApi';
import { useAuth } from '../hooks/useAuth';

const defaultSettings = {
    gradient: 'radial',
    color: '#5387be',
    fontSize: '1em',
    darkMode: true,
    padding: 'medium',
    animations: true,
    transparency: 0.15,
    radialPosition: 'top',
    linearAngle: '135deg',
};

const DisplaySettingsContext = createContext();

export const DisplaySettingsProvider = ({ children }) => {
    const { authState, isAuthenticated } = useAuth();
    const [settings, setSettings] = useState(defaultSettings);
    const [loaded, setLoaded] = useState(false);
    const { callApi } = useApi();

    const colorToRgba = (hex, alpha) => {
        if (!hex || typeof hex !== 'string' || hex.length !== 7) hex = '#5387be';
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const apply = (s = settings) => {
        const {
            fontSize,
            color,
            darkMode,
            gradient,
            transparency,
            radialPosition,
            linearAngle,
        } = s;

        document.documentElement.style.setProperty('--base-font-size', fontSize);
        document.documentElement.style.setProperty('--theme-color', color);
        document.body.className = darkMode ? 'dark' : 'light';

        const rgba = colorToRgba(color, transparency);

        const background =
            gradient === 'radial'
                ? `radial-gradient(circle at ${radialPosition}, ${rgba}, rgba(0, 0, 0, 0))`
                : gradient === 'linear'
                    ? `linear-gradient(${linearAngle}, ${rgba}, rgba(0, 0, 0, 0))`
                    : color;

        const app = document.querySelector('.App');
        if (app) app.style.background = background;
    };

    useEffect(() => {
        const load = async () => {
            try {
                const res = await callApi('settings/load/?category=display');
                const raw = res.data.reduce((acc, item) => {
                    acc[item.key] = item.value;
                    return acc;
                }, {});
                const merged = { ...defaultSettings, ...raw };
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
        if (isAuthenticated) {
            load();
        }
    }, []);

    return (
        <DisplaySettingsContext.Provider value={{ settings, setSettings, apply, loaded }}>
            {children}
        </DisplaySettingsContext.Provider>
    );
};

export const useDisplaySettings = () => useContext(DisplaySettingsContext);
