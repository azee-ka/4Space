import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ModeContext = createContext();

export const useModeContext = () => useContext(ModeContext);

export const ModeProvider = ({ children }) => {
    const [mode, setMode] = useState('home');
    const location = useLocation();

    useEffect(() => {
        const neutralPaths = ['/messages', '/profile', '/settings']; // List of "neutral" pages

        const isNeutralPage = neutralPaths.some(neutralPath => location.pathname.startsWith(neutralPath));

        if (!isNeutralPage) {
            // Only change mode if not on a neutral page
            if (location.pathname.includes('/communities')) {
                setMode('communities');
            } else if (location.pathname.includes('/space')) {
                setMode('space');
            } else {
                setMode('home');
            }
        }
        // If on a neutral page, DO NOTHING, preserve previous mode.
    }, [location.pathname]);

    return (
        <ModeContext.Provider value={{ mode, setMode }}>
            {children}
        </ModeContext.Provider>
    );
};
