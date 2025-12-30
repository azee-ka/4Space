import React, { useState } from 'react';
import './styles/ControlTunerWidget.css';

const ControlTunerWidget = ({ widget, mode, isCompact }) => {
  const [kp, setKp] = useState(1.0);
  const [ki, setKi] = useState(0.1);
  const [kd, setKd] = useState(0.05);
  
  if (mode === 'compact' || isCompact) {
    return (
      <div className="control-tuner-compact">
        <h3>⚙️ PID Tuner</h3>
        <div>Kp: {kp.toFixed(2)}</div>
        <div>Ki: {ki.toFixed(2)}</div>
        <div>Kd: {kd.toFixed(3)}</div>
      </div>
    );
  }

  return (
    <div className="control-tuner-modal">
      <h2>PID Controller Tuner</h2>
      <div className="tuner-controls">
        <label>Kp (Proportional): <input type="range" min="0" max="10" step="0.1" value={kp} onChange={(e) => setKp(parseFloat(e.target.value))} /> {kp.toFixed(2)}</label>
        <label>Ki (Integral): <input type="range" min="0" max="1" step="0.01" value={ki} onChange={(e) => setKi(parseFloat(e.target.value))} /> {ki.toFixed(2)}</label>
        <label>Kd (Derivative): <input type="range" min="0" max="1" step="0.01" value={kd} onChange={(e) => setKd(parseFloat(e.target.value))} /> {kd.toFixed(3)}</label>
      </div>
    </div>
  );
};

export default ControlTunerWidget;