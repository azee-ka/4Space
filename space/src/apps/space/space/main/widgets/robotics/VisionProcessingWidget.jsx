import React, { useState } from 'react';
import './styles/VisionProcessingWidget.css';

const VisionProcessingWidget = ({ widget, mode, isCompact }) => {
  const [algorithm, setAlgorithm] = useState('yolo');
  
  if (mode === 'compact' || isCompact) {
    return (
      <div className="vision-processing-compact">
        <h3>👁️ Vision System</h3>
        <div>Objects detected: 3</div>
        <div>FPS: 30</div>
      </div>
    );
  }

  return (
    <div className="vision-processing-modal">
      <h2>Computer Vision Processing</h2>
      <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
        <option value="yolo">YOLO</option>
        <option value="ssd">SSD</option>
        <option value="rcnn">R-CNN</option>
      </select>
      <div className="vision-stats">
        <div>Objects Detected: 3</div>
        <div>Frame Rate: 30 FPS</div>
        <div>Processing Time: 33ms</div>
      </div>
    </div>
  );
};

export default VisionProcessingWidget;