import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './loadingBar.css';

const LoadingBar = ({ isLoading }) => {
    const [progress, setProgress] = useState(0);
    const location = useLocation(); // Track route changes

    useEffect(() => {
        let interval;

        if (isLoading) {
            // Start loading animation
            setProgress(0);
            interval = setInterval(() => {
                setProgress((prevProgress) => {
                    if (prevProgress < 100) {
                        return prevProgress + 5; // Increase progress smoothly
                    }
                    clearInterval(interval); // Stop when it reaches 100
                    return 100;
                });
            }, 10); // Smooth progress increment (can adjust speed here)
        } else {
            setProgress(100); // Complete loading when not loading
        }

        return () => clearInterval(interval); // Clean up on unmount
    }, [isLoading, location]); // Depend on route changes and isLoading state

    return (
        <div
            className={`loading-bar ${isLoading ? 'loading' : 'finished'}`}
            style={{ width: `${progress}%` }}
        ></div>
    );
};

export default LoadingBar;
