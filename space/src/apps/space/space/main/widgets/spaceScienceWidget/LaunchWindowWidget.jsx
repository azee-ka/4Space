import React, { useState } from 'react';
import './styles/LaunchWindowWidget.css';

const LaunchWindowWidget = ({ widget, mode, isCompact }) => {
  const [destination, setDestination] = useState('mars');
  
  if (mode === 'compact' || isCompact) {
    return (
      <div className="launch-window-compact">
        <h3>🚀 Launch Windows</h3>
        <div>Next Mars window: 2026-10</div>
        <div>Duration: 30 days</div>
      </div>
    );
  }

  return (
    <div className="launch-window-modal">
      <h2>Launch Window Calculator</h2>
      <select value={destination} onChange={(e) => setDestination(e.target.value)}>
        <option value="mars">Mars</option>
        <option value="venus">Venus</option>
        <option value="jupiter">Jupiter</option>
      </select>
      <div className="window-info">
        <div>Next Window: October 2026</div>
        <div>Duration: 30 days</div>
        <div>Delta-V: 3.6 km/s</div>
      </div>
    </div>
  );
};

export default LaunchWindowWidget;