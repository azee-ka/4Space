import React, { useState } from 'react';
import './styles/SLAMMapperWidget.css';

const SLAMMapperWidget = ({ widget, mode, isCompact }) => {
  const [mapSize, setMapSize] = useState(100);
  
  if (mode === 'compact' || isCompact) {
    return (
      <div className="slam-mapper-compact">
        <h3>🗺️ SLAM Mapper</h3>
        <div>Map size: {mapSize}m²</div>
        <div>Landmarks: 45</div>
      </div>
    );
  }

  return (
    <div className="slam-mapper-modal">
      <h2>SLAM Mapping System</h2>
      <div className="slam-display">
        <div className="map-canvas">
          <div className="map-placeholder">Map visualization area</div>
        </div>
        <div className="slam-stats">
          <div>Mapped Area: {mapSize}m²</div>
          <div>Landmarks: 45</div>
          <div>Position Confidence: 92%</div>
        </div>
      </div>
    </div>
  );
};

export default SLAMMapperWidget;