// OrbitalSimulatorWidget.jsx
// Full implementation of 3D Orbital Mechanics Simulator
// Supports compact and modal modes with real Keplerian calculations

import React, { useState, useEffect, useRef } from 'react';
import './styles/OrbitalSimulatorWidget.css';

// Constants for orbital mechanics
const EARTH_RADIUS = 6371; // km
const EARTH_MU = 398600.4418; // km³/s²
const G0 = 9.80665; // m/s²

// Preset orbits with Keplerian elements
const PRESET_ORBITS = {
  leo: {
    name: 'LEO (ISS)',
    a: 6771, // semi-major axis (km)
    e: 0.0002, // eccentricity
    i: 51.6, // inclination (deg)
    omega: 0, // argument of periapsis (deg)
    Omega: 0, // RAAN (deg)
    M0: 0, // mean anomaly at epoch (deg)
    color: '#00f0ff'
  },
  geo: {
    name: 'GEO',
    a: 42164,
    e: 0.0001,
    i: 0,
    omega: 0,
    Omega: 0,
    M0: 0,
    color: '#10b981'
  },
  molniya: {
    name: 'Molniya',
    a: 26554,
    e: 0.74,
    i: 63.4,
    omega: 270,
    Omega: 0,
    M0: 0,
    color: '#f59e0b'
  },
  polar: {
    name: 'Polar SSO',
    a: 7178,
    e: 0.001,
    i: 98,
    omega: 0,
    Omega: 0,
    M0: 0,
    color: '#ec4899'
  }
};

const OrbitalSimulatorWidget = ({ widget, mode, isCompact, spaceId }) => {
  const [selectedOrbit, setSelectedOrbit] = useState('leo');
  const [orbits, setOrbits] = useState([PRESET_ORBITS.leo]);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [customOrbit, setCustomOrbit] = useState({
    name: 'Custom',
    a: 7000,
    e: 0,
    i: 0,
    omega: 0,
    Omega: 0,
    M0: 0,
    color: '#8b5cf6'
  });
  const [activeTab, setActiveTab] = useState('simulator');
  const [showGroundTrack, setShowGroundTrack] = useState(false);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Calculate orbital period (seconds)
  const calculatePeriod = (a) => {
    return 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / EARTH_MU);
  };

  // Calculate orbital velocity at distance r
  const calculateVelocity = (a, r) => {
    return Math.sqrt(EARTH_MU * (2 / r - 1 / a));
  };

  // Convert Keplerian elements to Cartesian position
  const keplerianToCartesian = (orbit, t) => {
    const { a, e, i, omega, Omega, M0 } = orbit;
    
    // Convert angles to radians
    const i_rad = (i * Math.PI) / 180;
    const omega_rad = (omega * Math.PI) / 180;
    const Omega_rad = (Omega * Math.PI) / 180;
    
    // Calculate mean motion
    const n = Math.sqrt(EARTH_MU / Math.pow(a, 3));
    
    // Calculate mean anomaly at time t
    const M = M0 + n * t;
    
    // Solve Kepler's equation for eccentric anomaly E (iterative)
    let E = M;
    for (let j = 0; j < 10; j++) {
      E = M + e * Math.sin(E);
    }
    
    // Calculate true anomaly
    const nu = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );
    
    // Calculate distance
    const r = a * (1 - e * Math.cos(E));
    
    // Position in orbital plane
    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);
    
    // Rotation matrices to convert to inertial frame
    const x = (Math.cos(omega_rad) * Math.cos(Omega_rad) - Math.sin(omega_rad) * Math.sin(Omega_rad) * Math.cos(i_rad)) * x_orb +
              (-Math.sin(omega_rad) * Math.cos(Omega_rad) - Math.cos(omega_rad) * Math.sin(Omega_rad) * Math.cos(i_rad)) * y_orb;
    
    const y = (Math.cos(omega_rad) * Math.sin(Omega_rad) + Math.sin(omega_rad) * Math.cos(Omega_rad) * Math.cos(i_rad)) * x_orb +
              (-Math.sin(omega_rad) * Math.sin(Omega_rad) + Math.cos(omega_rad) * Math.cos(Omega_rad) * Math.cos(i_rad)) * y_orb;
    
    const z = (Math.sin(omega_rad) * Math.sin(i_rad)) * x_orb + (Math.cos(omega_rad) * Math.sin(i_rad)) * y_orb;
    
    return { x, y, z, r };
  };

  // Draw orbit visualization
  const drawOrbit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Scale factor (pixels per km)
    const maxA = Math.max(...orbits.map(o => o.a * (1 + o.e)));
    const scale = Math.min(width, height) * 0.35 / maxA;
    
    // Draw Earth
    const earthRadius = EARTH_RADIUS * scale;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, earthRadius);
    gradient.addColorStop(0, '#4a9eff');
    gradient.addColorStop(0.7, '#2563eb');
    gradient.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw equator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw each orbit
    orbits.forEach((orbit) => {
      // Draw orbit path
      ctx.strokeStyle = orbit.color + '80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let angle = 0; angle <= 360; angle += 2) {
        const t = (angle / 360) * calculatePeriod(orbit.a);
        const pos = keplerianToCartesian(orbit, t);
        const x = centerX + pos.x * scale;
        const y = centerY - pos.y * scale; // Invert Y for canvas
        
        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Draw current satellite position
      const currentPos = keplerianToCartesian(orbit, time * timeSpeed);
      const satX = centerX + currentPos.x * scale;
      const satY = centerY - currentPos.y * scale;
      
      // Satellite glow
      const satGradient = ctx.createRadialGradient(satX, satY, 0, satX, satY, 8);
      satGradient.addColorStop(0, orbit.color);
      satGradient.addColorStop(1, orbit.color + '00');
      ctx.fillStyle = satGradient;
      ctx.beginPath();
      ctx.arc(satX, satY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Satellite dot
      ctx.fillStyle = orbit.color;
      ctx.beginPath();
      ctx.arc(satX, satY, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const radius = (maxA * scale * (i + 1)) / 8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  // Animation loop
  useEffect(() => {
    if (isPlaying && canvasRef.current) {
      animationRef.current = setInterval(() => {
        setTime(t => t + 0.1);
        drawOrbit();
      }, 50);
    } else if (canvasRef.current) {
      drawOrbit();
    }
    
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, orbits, time, timeSpeed]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawOrbit();
    }
  }, [mode, isCompact]);

  const currentOrbit = orbits[0];
  const period = calculatePeriod(currentOrbit.a);
  const altitude = currentOrbit.a - EARTH_RADIUS;
  const velocity = calculateVelocity(currentOrbit.a, currentOrbit.a);
  const apogee = currentOrbit.a * (1 + currentOrbit.e) - EARTH_RADIUS;
  const perigee = currentOrbit.a * (1 - currentOrbit.e) - EARTH_RADIUS;

  const addCustomOrbit = () => {
    setOrbits([...orbits, { ...customOrbit }]);
  };

  const addPresetOrbit = (preset) => {
    setOrbits([...orbits, PRESET_ORBITS[preset]]);
  };

  if (mode === 'compact' || isCompact) {
    return (
      <div className="orbital-simulator-compact">
        <div className="orbit-canvas-container-compact">
          <canvas ref={canvasRef} className="orbit-canvas" />
        </div>
        
        <div className="orbit-info-compact">
          <div className="orbit-param">
            <span className="param-label">Altitude</span>
            <span className="param-value">{altitude.toFixed(0)} km</span>
          </div>
          <div className="orbit-param">
            <span className="param-label">Velocity</span>
            <span className="param-value">{velocity.toFixed(2)} km/s</span>
          </div>
          <div className="orbit-param">
            <span className="param-label">Period</span>
            <span className="param-value">{(period / 60).toFixed(1)} min</span>
          </div>
        </div>
        
        <div className="orbit-presets-compact">
          {Object.keys(PRESET_ORBITS).map(key => (
            <button
              key={key}
              className={`preset-btn ${selectedOrbit === key ? 'active' : ''}`}
              onClick={() => {
                setSelectedOrbit(key);
                setOrbits([PRESET_ORBITS[key]]);
              }}
            >
              {PRESET_ORBITS[key].name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="orbital-simulator-modal">
      <div className="simulator-main">
        <div className="simulator-sidebar">
          <div className="sidebar-section">
            <h3>Controls</h3>
            <div className="control-group">
              <button
                className={`control-btn ${isPlaying ? 'active' : ''}`}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button className="control-btn" onClick={() => setTime(0)}>
                ⏮ Reset
              </button>
            </div>
            
            <div className="speed-control">
              <label>Time Speed: {timeSpeed}x</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={timeSpeed}
                onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Preset Orbits</h3>
            <div className="preset-list">
              {Object.keys(PRESET_ORBITS).map(key => (
                <button
                  key={key}
                  className="preset-item"
                  onClick={() => addPresetOrbit(key)}
                >
                  <span className="preset-color" style={{ backgroundColor: PRESET_ORBITS[key].color }} />
                  <span>{PRESET_ORBITS[key].name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Active Orbits</h3>
            <div className="active-orbits">
              {orbits.map((orbit, idx) => (
                <div key={idx} className="active-orbit-item">
                  <span className="orbit-color" style={{ backgroundColor: orbit.color }} />
                  <span className="orbit-name">{orbit.name}</span>
                  <button
                    className="remove-btn"
                    onClick={() => setOrbits(orbits.filter((_, i) => i !== idx))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Current Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-label">Altitude</div>
                <div className="metric-value">{altitude.toFixed(0)} km</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Velocity</div>
                <div className="metric-value">{velocity.toFixed(2)} km/s</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Period</div>
                <div className="metric-value">{(period / 60).toFixed(1)} min</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Apogee</div>
                <div className="metric-value">{apogee.toFixed(0)} km</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Perigee</div>
                <div className="metric-value">{perigee.toFixed(0)} km</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Eccentricity</div>
                <div className="metric-value">{currentOrbit.e.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="simulator-content">
          <div className="content-tabs">
            <button
              className={`tab ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulator')}
            >
              Simulator
            </button>
            <button
              className={`tab ${activeTab === 'creator' ? 'active' : ''}`}
              onClick={() => setActiveTab('creator')}
            >
              Orbit Creator
            </button>
            <button
              className={`tab ${activeTab === 'calculator' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculator')}
            >
              Calculator
            </button>
            <button
              className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'simulator' && (
              <div className="orbit-canvas-container">
                <canvas ref={canvasRef} className="orbit-canvas" />
                <div className="canvas-overlay">
                  <div className="time-display">
                    Time: {(time * timeSpeed).toFixed(1)}s
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'creator' && (
              <div className="orbit-creator">
                <h2>Custom Orbit Creator</h2>
                <p>Create a custom orbit using Keplerian elements</p>
                
                <div className="creator-form">
                  <div className="form-group">
                    <label>Orbit Name</label>
                    <input
                      type="text"
                      value={customOrbit.name}
                      onChange={(e) => setCustomOrbit({ ...customOrbit, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Semi-major Axis (km)</label>
                      <input
                        type="number"
                        value={customOrbit.a}
                        onChange={(e) => setCustomOrbit({ ...customOrbit, a: parseFloat(e.target.value) })}
                      />
                      <span className="hint">Distance from Earth center to orbit</span>
                    </div>
                    
                    <div className="form-group">
                      <label>Eccentricity</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="0.99"
                        value={customOrbit.e}
                        onChange={(e) => setCustomOrbit({ ...customOrbit, e: parseFloat(e.target.value) })}
                      />
                      <span className="hint">0 = circular, 0.99 = highly elliptical</span>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Inclination (deg)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="180"
                        value={customOrbit.i}
                        onChange={(e) => setCustomOrbit({ ...customOrbit, i: parseFloat(e.target.value) })}
                      />
                      <span className="hint">0° = equatorial, 90° = polar</span>
                    </div>
                    
                    <div className="form-group">
                      <label>RAAN (deg)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="360"
                        value={customOrbit.Omega}
                        onChange={(e) => setCustomOrbit({ ...customOrbit, Omega: parseFloat(e.target.value) })}
                      />
                      <span className="hint">Right Ascension of Ascending Node</span>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Argument of Periapsis (deg)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="360"
                        value={customOrbit.omega}
                        onChange={(e) => setCustomOrbit({ ...customOrbit, omega: parseFloat(e.target.value) })}
                      />
                      <span className="hint">Angle from ascending node to periapsis</span>
                    </div>
                    
                    <div className="form-group">
                      <label>Color</label>
                      <input
                        type="color"
                        value={customOrbit.color}
                        onChange={(e) => setCustomOrbit({ ...customOrbit, color: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <button className="create-btn" onClick={addCustomOrbit}>
                    Add Custom Orbit
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'calculator' && (
              <div className="orbit-calculator">
                <h2>Circular Orbit Calculator</h2>
                <p>Calculate parameters for circular orbits</p>
                
                <div className="calculator-form">
                  <div className="form-group">
                    <label>Altitude (km)</label>
                    <input
                      type="number"
                      value={altitude.toFixed(0)}
                      onChange={(e) => {
                        const newAlt = parseFloat(e.target.value);
                        setCustomOrbit({ ...customOrbit, a: newAlt + EARTH_RADIUS, e: 0 });
                      }}
                    />
                  </div>
                  
                  <div className="calc-results">
                    <div className="calc-result">
                      <span>Orbital Velocity:</span>
                      <span>{calculateVelocity(customOrbit.a, customOrbit.a).toFixed(3)} km/s</span>
                    </div>
                    <div className="calc-result">
                      <span>Orbital Period:</span>
                      <span>{(calculatePeriod(customOrbit.a) / 60).toFixed(2)} minutes</span>
                    </div>
                    <div className="calc-result">
                      <span>Angular Velocity:</span>
                      <span>{(360 / (calculatePeriod(customOrbit.a) / 60)).toFixed(4)} deg/min</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'analysis' && (
              <div className="orbit-analysis">
                <h2>Orbit Analysis</h2>
                
                <div className="analysis-grid">
                  {orbits.map((orbit, idx) => (
                    <div key={idx} className="analysis-card">
                      <div className="card-header">
                        <span className="card-color" style={{ backgroundColor: orbit.color }} />
                        <h3>{orbit.name}</h3>
                      </div>
                      
                      <div className="analysis-data">
                        <div className="data-row">
                          <span>Semi-major Axis:</span>
                          <span>{orbit.a.toFixed(2)} km</span>
                        </div>
                        <div className="data-row">
                          <span>Eccentricity:</span>
                          <span>{orbit.e.toFixed(4)}</span>
                        </div>
                        <div className="data-row">
                          <span>Inclination:</span>
                          <span>{orbit.i.toFixed(2)}°</span>
                        </div>
                        <div className="data-row">
                          <span>Period:</span>
                          <span>{(calculatePeriod(orbit.a) / 60).toFixed(2)} min</span>
                        </div>
                        <div className="data-row">
                          <span>Apogee Altitude:</span>
                          <span>{(orbit.a * (1 + orbit.e) - EARTH_RADIUS).toFixed(0)} km</span>
                        </div>
                        <div className="data-row">
                          <span>Perigee Altitude:</span>
                          <span>{(orbit.a * (1 - orbit.e) - EARTH_RADIUS).toFixed(0)} km</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrbitalSimulatorWidget;