import React, { useState } from 'react';
import './displayMenu.css';

const DisplayMenu = ({ onClose }) => {
    const [gradient, setGradient] = useState('radial');
    const [color, setColor] = useState('#5387be');
    const [fontSize, setFontSize] = useState('1em');
    const [darkMode, setDarkMode] = useState(true);
    const [padding, setPadding] = useState('medium');
    const [animations, setAnimations] = useState(true);

    const applySettings = () => {
        document.documentElement.style.setProperty('--base-font-size', fontSize);
        document.documentElement.style.setProperty('--theme-color', color);
        document.body.className = darkMode ? 'dark' : 'light';
    };

    return (
        <div className="display-settings-container" onClick={(e) => e.stopPropagation()}>
            <h3>Display Settings</h3>

            <div className="display-setting">
                <label>Background Style</label>
                <select value={gradient} onChange={(e) => setGradient(e.target.value)}>
                    <option value="radial">Radial</option>
                    <option value="linear">Linear</option>
                    <option value="solid">Solid Color</option>
                </select>
            </div>

            <div className="display-setting">
                <label>Primary Gradient Color</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>

            <div className="display-setting">
                <label>Font Size</label>
                <input type="range" min="0.8" max="1.5" step="0.1" value={parseFloat(fontSize)} onChange={(e) => setFontSize(`${e.target.value}em`)} />
            </div>

            <div className="display-setting toggle-group">
                <label htmlFor="darkModeToggle">Dark Mode</label>
                <label className="display-toggle">
                    <input
                        type="checkbox"
                        id="darkModeToggle"
                        checked={darkMode}
                        onChange={() => setDarkMode(!darkMode)}
                    />
                    <span className="display-toggle-slider"></span>
                </label>
            </div>

            <div className="display-setting">
                <label>Padding</label>
                <select value={padding} onChange={(e) => setPadding(e.target.value)}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                </select>
            </div>

            <div className="display-setting toggle-group">
                <label htmlFor="animationsToggle">Enable Animations</label>
                <label className="display-toggle">
                    <input
                        type="checkbox"
                        id="animationsToggle"
                        checked={animations}
                        onChange={() => setAnimations(!animations)}
                    />
                    <span className="display-toggle-slider"></span>
                </label>
            </div>
            <button onClick={applySettings}>Apply</button>
        </div>
    );
};

export default DisplayMenu;
