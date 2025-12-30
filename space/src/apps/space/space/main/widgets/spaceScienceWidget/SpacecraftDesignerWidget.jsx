import React, { useState } from 'react';
import './styles/SpacecraftDesignerWidget.css';

const SpacecraftDesignerWidget = ({ widget, mode, isCompact }) => {
  const [mass, setMass] = useState(5000);
  const [power, setPower] = useState(10);
  
  if (mode === 'compact' || isCompact) {
    return (
      <div className="spacecraft-designer-compact">
        <h3>🛰️ Spacecraft Designer</h3>
        <div>Mass: {mass} kg</div>
        <div>Power: {power} kW</div>
      </div>
    );
  }

  return (
    <div className="spacecraft-designer-modal">
      <h2>Spacecraft Configuration</h2>
      <div className="designer-form">
        <label>Dry Mass (kg): <input type="number" value={mass} onChange={(e) => setMass(parseFloat(e.target.value))} /></label>
        <label>Power (kW): <input type="number" value={power} onChange={(e) => setPower(parseFloat(e.target.value))} /></label>
        <div className="design-summary">
          <div>Total Mass: {mass} kg</div>
          <div>Power Budget: {power} kW</div>
        </div>
      </div>
    </div>
  );
};

export default SpacecraftDesignerWidget;