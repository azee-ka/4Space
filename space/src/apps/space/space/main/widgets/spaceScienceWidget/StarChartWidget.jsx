// StarChartWidget.jsx - Interactive Star Chart and Sky Map
import React, { useState, useRef, useEffect } from 'react';
import './styles/StarChartWidget.css';

const CONSTELLATIONS = [
  { name: 'Orion', stars: 7, magnitude: 0.12 },
  { name: 'Ursa Major', stars: 7, magnitude: 1.79 },
  { name: 'Cassiopeia', stars: 5, magnitude: 2.23 },
  { name: 'Leo', stars: 9, magnitude: 1.35 },
  { name: 'Scorpius', stars: 18, magnitude: 0.96 }
];

const StarChartWidget = ({ widget, mode, isCompact }) => {
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('20:00');
  const [showConstellations, setShowConstellations] = useState(true);
  const [activeTab, setActiveTab] = useState('chart');
  const canvasRef = useRef(null);

  const drawStarChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw celestial sphere
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw grid lines
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
      ctx.stroke();
    }
    
    // Draw stars (random for demo)
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
      const size = Math.random() * 2 + 0.5;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      
      // Star glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fff';
    }
    
    // Draw constellations
    if (showConstellations) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 1;
      CONSTELLATIONS.forEach((constellation, idx) => {
        const angle = ((idx / CONSTELLATIONS.length) * 2 * Math.PI) + (Date.now() / 10000);
        const distance = radius * 0.7;
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);
        
        ctx.fillStyle = '#00f0ff';
        ctx.font = '10px Arial';
        ctx.fillText(constellation.name, x - 20, y - 10);
      });
    }
    
    // Compass directions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Arial';
    ctx.fillText('N', centerX - 5, 20);
    ctx.fillText('S', centerX - 5, height - 10);
    ctx.fillText('E', width - 20, centerY + 5);
    ctx.fillText('W', 10, centerY + 5);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      drawStarChart();
    }
  }, [showConstellations, selectedDate, selectedTime]);

  if (mode === 'compact' || isCompact) {
    return (
      <div className="star-chart-compact">
        <div className="chart-canvas-compact">
          <canvas ref={canvasRef} />
        </div>
        <div className="chart-info-compact">
          <div className="info-item">
            <span>Location:</span>
            <span>{latitude.toFixed(2)}°, {longitude.toFixed(2)}°</span>
          </div>
          <div className="info-item">
            <span>Time:</span>
            <span>{selectedTime}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="star-chart-modal">
      <div className="chart-sidebar">
        <div className="sidebar-section">
          <h3>Location</h3>
          <div className="form-group">
            <label>Latitude</label>
            <input
              type="number"
              step="0.1"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input
              type="number"
              step="0.1"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
            />
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3>Date & Time</h3>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3>Display Options</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showConstellations}
              onChange={(e) => setShowConstellations(e.target.checked)}
            />
            Show Constellations
          </label>
        </div>
        
        <div className="sidebar-section">
          <h3>Visible Objects</h3>
          <div className="objects-list">
            {CONSTELLATIONS.map((c, idx) => (
              <div key={idx} className="object-item">
                <span>{c.name}</span>
                <span className="magnitude">mag {c.magnitude}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="chart-main">
        <div className="chart-tabs">
          <button className={`tab ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>Sky Chart</button>
          <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>Search Objects</button>
          <button className={`tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Tonight's Events</button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'chart' && (
            <div className="chart-viewport">
              <canvas ref={canvasRef} />
              <div className="viewport-info">
                <div>Viewing: {selectedDate.toLocaleDateString()} at {selectedTime}</div>
                <div>Location: {latitude.toFixed(2)}°, {longitude.toFixed(2)}°</div>
              </div>
            </div>
          )}
          
          {activeTab === 'search' && (
            <div className="search-panel">
              <h2>Search Celestial Objects</h2>
              <input
                type="text"
                placeholder="Search stars, planets, constellations..."
                className="search-input"
              />
              <div className="search-results">
                <p>Enter a search term to find celestial objects</p>
              </div>
            </div>
          )}
          
          {activeTab === 'events' && (
            <div className="events-panel">
              <h2>Tonight's Astronomical Events</h2>
              <div className="events-list">
                <div className="event-item">
                  <span className="event-time">21:30</span>
                  <span className="event-desc">Jupiter visible in eastern sky</span>
                </div>
                <div className="event-item">
                  <span className="event-time">23:00</span>
                  <span className="event-desc">International Space Station pass</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StarChartWidget;