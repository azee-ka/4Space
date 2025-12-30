// RobotSimulatorWidget.jsx - 3D Robot Simulator with Physics
import React, { useState, useRef, useEffect } from 'react';
import './styles/RobotSimulatorWidget.css';

const RobotSimulatorWidget = ({ widget, mode, isCompact }) => {
  const [jointAngles, setJointAngles] = useState([0, 45, -45, 0, 0, 0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trajectory, setTrajectory] = useState([]);
  const [selectedRobot, setSelectedRobot] = useState('6dof-arm');
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);
  const [activeTab, setActiveTab] = useState('sim');
  const canvasRef = useRef(null);

  const ROBOT_CONFIGS = {
    '6dof-arm': { name: '6-DOF Manipulator', joints: 6, linkLengths: [100, 150, 120, 80, 60, 40] },
    'scara': { name: 'SCARA Robot', joints: 4, linkLengths: [150, 150, 0, 100] },
    'delta': { name: 'Delta Robot', joints: 3, linkLengths: [120, 200, 50] },
    'mobile': { name: 'Mobile Robot', joints: 2, linkLengths: [80, 80] }
  };

  const drawRobot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 100;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Draw robot
    const config = ROBOT_CONFIGS[selectedRobot];
    let x = centerX, y = centerY;
    let angle = 0;
    
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    // Base
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw links
    for (let i = 0; i < Math.min(jointAngles.length, config.joints); i++) {
      angle += (jointAngles[i] * Math.PI) / 180;
      const linkLength = config.linkLengths[i] || 100;
      const newX = x + linkLength * Math.cos(angle - Math.PI / 2);
      const newY = y + linkLength * Math.sin(angle - Math.PI / 2);
      
      // Link
      const gradient = ctx.createLinearGradient(x, y, newX, newY);
      gradient.addColorStop(0, '#00f0ff');
      gradient.addColorStop(1, '#0080ff');
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(newX, newY);
      ctx.stroke();
      
      // Joint
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(newX, newY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      x = newX;
      y = newY;
    }
    
    // End effector
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw trajectory
    if (trajectory.length > 1) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(trajectory[0].x, trajectory[0].y);
      for (let i = 1; i < trajectory.length; i++) {
        ctx.lineTo(trajectory[i].x, trajectory[i].y);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      drawRobot();
    }
  }, [jointAngles, selectedRobot, trajectory]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setJointAngles(prev => prev.map((angle, idx) => 
          angle + (Math.sin(Date.now() / 1000 + idx) * 2 * simulationSpeed)
        ));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isPlaying, simulationSpeed]);

  const updateJoint = (idx, value) => {
    const newAngles = [...jointAngles];
    newAngles[idx] = parseFloat(value);
    setJointAngles(newAngles);
  };

  const resetPose = () => {
    setJointAngles(new Array(6).fill(0));
    setTrajectory([]);
  };

  if (mode === 'compact' || isCompact) {
    return (
      <div className="robot-sim-compact">
        <div className="sim-canvas-compact">
          <canvas ref={canvasRef} />
        </div>
        <div className="sim-controls-compact">
          <select value={selectedRobot} onChange={(e) => setSelectedRobot(e.target.value)}>
            {Object.entries(ROBOT_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="robot-sim-modal">
      <div className="sim-sidebar">
        <div className="sidebar-section">
          <h3>Robot Configuration</h3>
          <select value={selectedRobot} onChange={(e) => setSelectedRobot(e.target.value)}>
            {Object.entries(ROBOT_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
        </div>
        
        <div className="sidebar-section">
          <h3>Joint Controls</h3>
          {jointAngles.slice(0, ROBOT_CONFIGS[selectedRobot].joints).map((angle, idx) => (
            <div key={idx} className="joint-control">
              <label>Joint {idx + 1}: {angle.toFixed(1)}°</label>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={angle}
                onChange={(e) => updateJoint(idx, e.target.value)}
              />
            </div>
          ))}
        </div>
        
        <div className="sidebar-section">
          <h3>Simulation</h3>
          <button className="control-btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button className="control-btn" onClick={resetPose}>Reset</button>
          <div className="speed-control">
            <label>Speed: {simulationSpeed.toFixed(1)}x</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>
      
      <div className="sim-main">
        <div className="sim-tabs">
          <button className={`tab ${activeTab === 'sim' ? 'active' : ''}`} onClick={() => setActiveTab('sim')}>Simulator</button>
          <button className={`tab ${activeTab === 'physics' ? 'active' : ''}`} onClick={() => setActiveTab('physics')}>Physics</button>
          <button className={`tab ${activeTab === 'sensors' ? 'active' : ''}`} onClick={() => setActiveTab('sensors')}>Sensors</button>
        </div>
        
        <div className="sim-content">
          {activeTab === 'sim' && (
            <div className="sim-viewport">
              <canvas ref={canvasRef} />
              <div className="viewport-info">
                <div>Robot: {ROBOT_CONFIGS[selectedRobot].name}</div>
                <div>Joints: {ROBOT_CONFIGS[selectedRobot].joints}</div>
                <div>Status: {isPlaying ? 'Running' : 'Paused'}</div>
              </div>
            </div>
          )}
          
          {activeTab === 'physics' && (
            <div className="physics-panel">
              <h2>Physics Parameters</h2>
              <div className="params-grid">
                <div className="param-item">
                  <label>Gravity (m/s²)</label>
                  <input type="number" defaultValue="9.81" />
                </div>
                <div className="param-item">
                  <label>Time Step (ms)</label>
                  <input type="number" defaultValue="10" />
                </div>
                <div className="param-item">
                  <label>Damping</label>
                  <input type="number" defaultValue="0.1" step="0.01" />
                </div>
                <div className="param-item">
                  <label>Friction</label>
                  <input type="number" defaultValue="0.5" step="0.1" />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'sensors' && (
            <div className="sensors-panel">
              <h2>Sensor Outputs</h2>
              <div className="sensor-grid">
                <div className="sensor-card">
                  <h3>Encoders</h3>
                  {jointAngles.map((angle, idx) => (
                    <div key={idx} className="sensor-reading">
                      <span>Joint {idx + 1}:</span>
                      <span>{angle.toFixed(2)}°</span>
                    </div>
                  ))}
                </div>
                <div className="sensor-card">
                  <h3>End Effector Position</h3>
                  <div className="sensor-reading">
                    <span>X:</span>
                    <span>250 mm</span>
                  </div>
                  <div className="sensor-reading">
                    <span>Y:</span>
                    <span>180 mm</span>
                  </div>
                  <div className="sensor-reading">
                    <span>Z:</span>
                    <span>120 mm</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RobotSimulatorWidget;