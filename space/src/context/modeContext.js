// modeContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ModeContext = createContext();

export const useModeContext = () => useContext(ModeContext);

export const ModeProvider = ({ children }) => {
    const location = useLocation();
    const [mode, setMode] = useState('home');           // main context: home, communities, space
    const [subMode, setSubMode] = useState(null);       // e.g., workspace, finance

    useEffect(() => {
        const { pathname } = location;
        const neutralPaths = ['/messages', '/profile', '/settings'];

        const isNeutralPage = neutralPaths.some(path => pathname.startsWith(path));

        if (!isNeutralPage) {
            if (pathname.includes('/communities')) {
                setMode('communities');
                setSubMode(null);
            } else if (pathname.startsWith('/space')) {
                if (pathname.includes('/workspace')) {
                    setMode('space');
                    setSubMode('workspace');
                } else {
                    setMode('space');
                    setSubMode(null);
                }

                // Determine subMode inside /space/
                const spaceSegments = pathname.split('/'); // e.g., ['', 'space', 'finance', 'dashboard']
                const maybeSubMode = spaceSegments[2] || 'space';
                setSubMode(maybeSubMode); // workspace | finance | etc.
            } else {
                setMode('home');
                setSubMode(null);
            }
        }
        // If on a neutral page, preserve previous mode/subMode.
    }, [location.pathname]);

    return (
        <ModeContext.Provider value={{ mode, subMode, setMode, setSubMode }}>
            {children}
        </ModeContext.Provider>
    );
};
