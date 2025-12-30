import React, { useState } from 'react';
import './styles/PlanetTrackerWidget.css';

const PLANETS = [
  { name: 'Mercury', distance: 0.39, period: 88, color: '#8c8c8c' },
  { name: 'Venus', distance: 0.72, period: 225, color: '#ffd89b' },
  { name: 'Mars', distance: 1.52, period: 687, color: '#f97316' },
  { name: 'Jupiter', distance: 5.20, period: 4333, color: '#d4a574' },
  { name: 'Saturn', distance: 9.54, period: 10759, color: '#f4e4c1' }
];

const PlanetTrackerWidget = ({ widget, mode, isCompact }) => {
  const [selectedPlanet, setSelectedPlanet] = useState('Mars');
  
  if (mode === 'compact' || isCompact) {
    return (
      <div className="planet-tracker-compact">
        <h3>🪐 Planet Tracker</h3>
        <select value={selectedPlanet} onChange={(e) => setSelectedPlanet(e.target.value)}>
          {PLANETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <div className="planet-info">
          <div>Distance: {PLANETS.find(p => p.name === selectedPlanet)?.distance} AU</div>
          <div>Period: {PLANETS.find(p => p.name === selectedPlanet)?.period} days</div>
        </div>
      </div>
    );
  }

  return (
    <div className="planet-tracker-modal">
      <h2>Planet Positions & Visibility</h2>
      <div className="planets-grid">
        {PLANETS.map(planet => (
          <div key={planet.name} className="planet-card" style={{ borderColor: planet.color }}>
            <h3>{planet.name}</h3>
            <div>Distance: {planet.distance} AU</div>
            <div>Orbital Period: {planet.period} days</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanetTrackerWidget;