// RobotKinematicsWidget.jsx - Forward & Inverse Kinematics Calculator
import React, { useState, useRef, useEffect } from 'react';
import './styles/RobotKinematicsWidget.css';

const RobotKinematicsWidget = ({ widget, mode, isCompact }) => {
  const [dhParams, setDhParams] = useState([
    { theta: 0, d: 100, a: 0, alpha: 90 },
    { theta: 0, d: 0, a: 150, alpha: 0 },
    { theta: 0, d: 0, a: 120, alpha: 0 },
    { theta: 0, d: 0, a: 80, alpha: 90 },
    { theta: 0, d: 60, a: 0, alpha: -90 },
    { theta: 0, d: 40, a: 0, alpha: 0 }
  ]);
  const [targetPose, setTargetPose] = useState({ x: 200, y: 0, z: 150 });
  const [activeTab, setActiveTab] = useState('forward');
  const [workspace, setWorkspace] = useState([]);
  const canvasRef = useRef(null);

  // Forward Kinematics calculation
  const forwardKinematics = () => {
    let x = 0, y = 0, z = 0;
    let angle = 0;
    
    dhParams.forEach((param) => {
      angle += (param.theta * Math.PI) / 180;
      const length = param.a;
      x += length * Math.cos(angle);
      z += length * Math.sin(angle);
    });
    
    return { x: x.toFixed(2), y: y.toFixed(2), z: z.toFixed(2) };
  };

  // Simple Inverse Kinematics (2D analytical solution for first 3 joints)
  const inverseKinematics = (target) => {
    const l1 = dhParams[1].a;
    const l2 = dhParams[2].a;
    const x = target.x;
    const z = target.z;
    
    const r = Math.sqrt(x * x + z * z);
    
    // Check if target is reachable
    if (r > l1 + l2 || r < Math.abs(l1 - l2)) {
      return null; // Unreachable
    }
    
    // Calculate joint angles using law of cosines
    const cos_theta2 = (r * r - l1 * l1 - l2 * l2) / (2 * l1 * l2);
    const theta2 = Math.acos(Math.max(-1, Math.min(1, cos_theta2)));
    
    const k1 = l1 + l2 * Math.cos(theta2);
    const k2 = l2 * Math.sin(theta2);
    const theta1 = Math.atan2(z, x) - Math.atan2(k2, k1);
    
    return [
      (theta1 * 180) / Math.PI,
      (theta2 * 180) / Math.PI,
      0, 0, 0, 0
    ];
  };

  // Jacobian matrix calculation (simplified)
  const calculateJacobian = () => {
    const J = [];
    const eps = 0.001;
    
    const basePos = forwardKinematics();
    
    dhParams.forEach((param, i) => {
      const newParams = [...dhParams];
      newParams[i] = { ...param, theta: param.theta + eps };
      
      // Calculate partial derivatives
      const row = [0, 0, 0];
      J.push(row);
    });
    
    return J;
  };

  // Draw robot arm visualization
  const drawRobot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 100;
    const scale = 1.5;
    
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
    
    // Draw robot base
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw links
    let x = centerX, y = centerY;
    let angle = 0;
    
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    
    dhParams.forEach((param, idx) => {
      angle += (param.theta * Math.PI) / 180;
      const length = param.a * scale;
      const newX = x + length * Math.cos(angle - Math.PI / 2);
      const newY = y + length * Math.sin(angle - Math.PI / 2);
      
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
    });
    
    // End effector
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw workspace
    if (workspace.length > 0) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      workspace.forEach((point, i) => {
        const px = centerX + point.x * scale;
        const py = centerY - point.z * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
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
  }, [dhParams]);

  const calculateWorkspace = () => {
    const points = [];
    const steps = 36;
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const tempParams = [...dhParams];
      tempParams[1].theta = (angle * 180) / Math.PI;
      
      let x = 0, z = 0, cumAngle = 0;
      tempParams.forEach((param) => {
        cumAngle += (param.theta * Math.PI) / 180;
        x += param.a * Math.cos(cumAngle);
        z += param.a * Math.sin(cumAngle);
      });
      
      points.push({ x, z });
    }
    
    setWorkspace(points);
  };

  const updateDHParam = (idx, field, value) => {
    const newParams = [...dhParams];
    newParams[idx][field] = parseFloat(value) || 0;
    setDhParams(newParams);
  };

  const solveIK = () => {
    const solution = inverseKinematics(targetPose);
    if (solution) {
      const newParams = dhParams.map((param, i) => ({
        ...param,
        theta: solution[i]
      }));
      setDhParams(newParams);
    } else {
      alert('Target position is unreachable!');
    }
  };

  const endEffectorPos = forwardKinematics();

  if (mode === 'compact' || isCompact) {
    return (
      <div className="robot-kinematics-compact">
        <div className="compact-canvas">
          <canvas ref={canvasRef} />
        </div>
        <div className="compact-info">
          <div className="info-row">
            <span>End Effector:</span>
            <span>({endEffectorPos.x}, {endEffectorPos.y}, {endEffectorPos.z})</span>
          </div>
          <div className="info-row">
            <span>Joints:</span>
            <span>{dhParams.length} DOF</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="robot-kinematics-modal">
      <div className="kinematics-sidebar">
        <div className="sidebar-section">
          <h3>DH Parameters</h3>
          <div className="dh-table">
            <div className="dh-header">
              <span>Link</span>
              <span>θ (deg)</span>
              <span>d (mm)</span>
              <span>a (mm)</span>
              <span>α (deg)</span>
            </div>
            {dhParams.map((param, idx) => (
              <div key={idx} className="dh-row">
                <span>{idx + 1}</span>
                <input
                  type="number"
                  value={param.theta}
                  onChange={(e) => updateDHParam(idx, 'theta', e.target.value)}
                />
                <input
                  type="number"
                  value={param.d}
                  onChange={(e) => updateDHParam(idx, 'd', e.target.value)}
                />
                <input
                  type="number"
                  value={param.a}
                  onChange={(e) => updateDHParam(idx, 'a', e.target.value)}
                />
                <input
                  type="number"
                  value={param.alpha}
                  onChange={(e) => updateDHParam(idx, 'alpha', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3>End Effector Position</h3>
          <div className="position-display">
            <div className="pos-value">X: {endEffectorPos.x} mm</div>
            <div className="pos-value">Y: {endEffectorPos.y} mm</div>
            <div className="pos-value">Z: {endEffectorPos.z} mm</div>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3>Actions</h3>
          <button className="action-btn" onClick={calculateWorkspace}>
            Calculate Workspace
          </button>
          <button className="action-btn" onClick={() => setDhParams(dhParams.map(p => ({ ...p, theta: 0 })))}>
            Reset Pose
          </button>
        </div>
      </div>
      
      <div className="kinematics-main">
        <div className="kinematics-tabs">
          <button className={`tab ${activeTab === 'forward' ? 'active' : ''}`} onClick={() => setActiveTab('forward')}>Forward Kinematics</button>
          <button className={`tab ${activeTab === 'inverse' ? 'active' : ''}`} onClick={() => setActiveTab('inverse')}>Inverse Kinematics</button>
          <button className={`tab ${activeTab === 'jacobian' ? 'active' : ''}`} onClick={() => setActiveTab('jacobian')}>Jacobian</button>
          <button className={`tab ${activeTab === 'workspace' ? 'active' : ''}`} onClick={() => setActiveTab('workspace')}>Workspace</button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'forward' && (
            <div className="forward-panel">
              <div className="visualization">
                <canvas ref={canvasRef} />
              </div>
            </div>
          )}
          
          {activeTab === 'inverse' && (
            <div className="inverse-panel">
              <h2>Inverse Kinematics Solver</h2>
              <div className="ik-form">
                <div className="form-group">
                  <label>Target X (mm)</label>
                  <input
                    type="number"
                    value={targetPose.x}
                    onChange={(e) => setTargetPose({ ...targetPose, x: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Target Y (mm)</label>
                  <input
                    type="number"
                    value={targetPose.y}
                    onChange={(e) => setTargetPose({ ...targetPose, y: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Target Z (mm)</label>
                  <input
                    type="number"
                    value={targetPose.z}
                    onChange={(e) => setTargetPose({ ...targetPose, z: parseFloat(e.target.value) })}
                  />
                </div>
                <button className="solve-btn" onClick={solveIK}>Solve IK</button>
              </div>
              <div className="visualization">
                <canvas ref={canvasRef} />
              </div>
            </div>
          )}
          
          {activeTab === 'jacobian' && (
            <div className="jacobian-panel">
              <h2>Jacobian Matrix</h2>
              <p>The Jacobian matrix relates joint velocities to end-effector velocities.</p>
              <div className="matrix-display">
                <div className="matrix">J = [...] (Calculation in progress)</div>
              </div>
            </div>
          )}
          
          {activeTab === 'workspace' && (
            <div className="workspace-panel">
              <h2>Workspace Analysis</h2>
              <button className="calc-btn" onClick={calculateWorkspace}>
                Calculate Reachable Workspace
              </button>
              <div className="visualization">
                <canvas ref={canvasRef} />
              </div>
              {workspace.length > 0 && (
                <div className="workspace-stats">
                  <div>Workspace Points: {workspace.length}</div>
                  <div>Max Reach: {Math.max(...workspace.map(p => Math.sqrt(p.x * p.x + p.z * p.z))).toFixed(0)} mm</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RobotKinematicsWidget;