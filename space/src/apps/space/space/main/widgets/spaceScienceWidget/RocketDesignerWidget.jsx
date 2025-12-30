import React, { useState } from 'react';
import './styles/RocketDesignerWidget.css';

const RocketDesignerWidget = ({ widget, mode, isCompact }) => {
  const [stages, setStages] = useState(2);
  const [thrust, setThrust] = useState(7500);
  
  if (mode === 'compact' || isCompact) {
    return (
      <div className="rocket-designer-compact">
        <h3>🚀 Rocket Designer</h3>
        <div>Stages: {stages}</div>
        <div>Thrust: {thrust} kN</div>
      </div>
    );
  }

  return (
    <div className="rocket-designer-modal">
      <h2>Rocket Configuration</h2>
      <div className="rocket-form">
        <label>Number of Stages: <input type="number" min="1" max="5" value={stages} onChange={(e) => setStages(parseInt(e.target.value))} /></label>
        <label>Thrust (kN): <input type="number" value={thrust} onChange={(e) => setThrust(parseFloat(e.target.value))} /></label>
        <div className="rocket-stats">
          <div>Total Stages: {stages}</div>
          <div>Sea Level Thrust: {thrust} kN</div>
          <div>T/W Ratio: {(thrust / 600).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default RocketDesignerWidget;