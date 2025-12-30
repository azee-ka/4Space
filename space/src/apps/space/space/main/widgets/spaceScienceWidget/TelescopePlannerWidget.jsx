import React, { useState } from 'react';
import './styles/TelescopePlannerWidget.css';

const TelescopePlannerWidget = ({ widget, mode, isCompact }) => {
  const [aperture, setAperture] = useState(200);
  const [focalLength, setFocalLength] = useState(1000);
  
  const magnification = focalLength / 25;
  
  if (mode === 'compact' || isCompact) {
    return (
      <div className="telescope-planner-compact">
        <h3>🔭 Telescope Planner</h3>
        <div className="telescope-info">
          <div>Aperture: {aperture}mm</div>
          <div>Magnification: {magnification.toFixed(0)}x</div>
        </div>
      </div>
    );
  }

  return (
    <div className="telescope-planner-modal">
      <h2>Telescope Configuration</h2>
      <div className="telescope-form">
        <label>Aperture (mm): <input type="number" value={aperture} onChange={(e) => setAperture(parseFloat(e.target.value))} /></label>
        <label>Focal Length (mm): <input type="number" value={focalLength} onChange={(e) => setFocalLength(parseFloat(e.target.value))} /></label>
        <div className="results">
          <div>Magnification: {magnification.toFixed(0)}x</div>
          <div>Resolution: {(138 / aperture).toFixed(2)} arcsec</div>
        </div>
      </div>
    </div>
  );
};

export default TelescopePlannerWidget;