// DeltaVCalculatorWidget.jsx - Delta-V Mission Planning Calculator
import React, { useState } from 'react';
import './styles/DeltaVCalculatorWidget.css';

const G0 = 9.80665; // m/s²

const COMMON_MANEUVERS = {
  'leo-geo': { name: 'LEO to GEO Transfer', deltaV: 3914 },
  'leo-lunar': { name: 'LEO to Lunar Transfer', deltaV: 3150 },
  'lunar-orbit': { name: 'Lunar Orbit Insertion', deltaV: 680 },
  'leo-mars': { name: 'LEO to Mars Transfer', deltaV: 3600 },
  'mars-capture': { name: 'Mars Capture', deltaV: 950 },
  'mars-landing': { name: 'Mars Descent', deltaV: 3800 },
  'leo-escape': { name: 'LEO to Earth Escape', deltaV: 3200 },
};

const DeltaVCalculatorWidget = ({ widget, mode, isCompact }) => {
  const [payloadMass, setPayloadMass] = useState(1000);
  const [specificImpulse, setSpecificImpulse] = useState(350);
  const [selectedManeuver, setSelectedManeuver] = useState('leo-geo');
  const [missions, setMissions] = useState([]);
  const [stages, setStages] = useState([
    { name: 'Stage 1', isp: 350, dryMass: 2000, deltaV: 0 }
  ]);
  const [activeTab, setActiveTab] = useState('quick');

  const calculateDeltaV = (isp, m0, mf) => {
    const ve = isp * G0;
    return ve * Math.log(m0 / mf);
  };

  const calculateMassRatio = (deltaV, isp) => {
    const ve = isp * G0;
    return Math.exp(deltaV / ve);
  };

  const quickCalc = () => {
    const maneuver = COMMON_MANEUVERS[selectedManeuver];
    const massRatio = calculateMassRatio(maneuver.deltaV, specificImpulse);
    const totalMass = payloadMass * massRatio;
    const propellantMass = totalMass - payloadMass;
    
    return {
      deltaV: maneuver.deltaV,
      massRatio: massRatio.toFixed(3),
      totalMass: totalMass.toFixed(0),
      propellantMass: propellantMass.toFixed(0),
      ve: (specificImpulse * G0).toFixed(0)
    };
  };

  const addMission = (maneuver) => {
    setMissions([...missions, { ...COMMON_MANEUVERS[maneuver], id: Date.now() }]);
  };

  const calculateTotalDeltaV = () => {
    return missions.reduce((sum, m) => sum + m.deltaV, 0);
  };

  const addStage = () => {
    setStages([...stages, { name: `Stage ${stages.length + 1}`, isp: 350, dryMass: 1000, deltaV: 0 }]);
  };

  const updateStage = (idx, field, value) => {
    const newStages = [...stages];
    newStages[idx][field] = parseFloat(value) || 0;
    setStages(newStages);
  };

  const calculateStages = () => {
    const totalDeltaV = calculateTotalDeltaV();
    let currentMass = payloadMass;
    const newStages = [...stages].reverse();
    
    newStages.forEach((stage, idx) => {
      const stageShare = stage.deltaV || (totalDeltaV / stages.length);
      const massRatio = calculateMassRatio(stageShare, stage.isp);
      const stageTotalMass = currentMass * massRatio;
      stage.propellantMass = stageTotalMass - currentMass - stage.dryMass;
      stage.totalMass = stageTotalMass;
      currentMass = stageTotalMass;
    });
    
    setStages(newStages.reverse());
  };

  if (mode === 'compact' || isCompact) {
    const calc = quickCalc();
    
    return (
      <div className="deltav-compact">
        <div className="compact-header">
          <h3>Quick Delta-V Calculator</h3>
        </div>
        
        <div className="compact-inputs">
          <div className="input-group">
            <label>Payload Mass (kg)</label>
            <input
              type="number"
              value={payloadMass}
              onChange={(e) => setPayloadMass(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="input-group">
            <label>Specific Impulse (s)</label>
            <input
              type="number"
              value={specificImpulse}
              onChange={(e) => setSpecificImpulse(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="input-group">
            <label>Maneuver</label>
            <select value={selectedManeuver} onChange={(e) => setSelectedManeuver(e.target.value)}>
              {Object.keys(COMMON_MANEUVERS).map(key => (
                <option key={key} value={key}>{COMMON_MANEUVERS[key].name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="compact-results">
          <div className="result-item">
            <span>Δv Required:</span>
            <span className="result-value">{calc.deltaV} m/s</span>
          </div>
          <div className="result-item">
            <span>Total Mass:</span>
            <span className="result-value">{calc.totalMass} kg</span>
          </div>
          <div className="result-item">
            <span>Propellant:</span>
            <span className="result-value">{calc.propellantMass} kg</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deltav-modal">
      <div className="modal-tabs">
        <button className={`tab ${activeTab === 'quick' ? 'active' : ''}`} onClick={() => setActiveTab('quick')}>Quick Calc</button>
        <button className={`tab ${activeTab === 'mission' ? 'active' : ''}`} onClick={() => setActiveTab('mission')}>Mission Builder</button>
        <button className={`tab ${activeTab === 'stages' ? 'active' : ''}`} onClick={() => setActiveTab('stages')}>Stages</button>
        <button className={`tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>Delta-V Map</button>
      </div>
      
      <div className="modal-content">
        {activeTab === 'quick' && (
          <div className="quick-calc">
            <h2>Quick Delta-V Calculator</h2>
            <div className="calc-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Payload Mass (kg)</label>
                  <input type="number" value={payloadMass} onChange={(e) => setPayloadMass(parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Specific Impulse (s)</label>
                  <input type="number" value={specificImpulse} onChange={(e) => setSpecificImpulse(parseFloat(e.target.value))} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Select Maneuver</label>
                <select value={selectedManeuver} onChange={(e) => setSelectedManeuver(e.target.value)}>
                  {Object.keys(COMMON_MANEUVERS).map(key => (
                    <option key={key} value={key}>{COMMON_MANEUVERS[key].name}</option>
                  ))}
                </select>
              </div>
              
              <div className="results-grid">
                <div className="result-card">
                  <div className="result-label">Delta-V Required</div>
                  <div className="result-big">{quickCalc().deltaV} m/s</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Mass Ratio</div>
                  <div className="result-big">{quickCalc().massRatio}</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Total Mass</div>
                  <div className="result-big">{quickCalc().totalMass} kg</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Propellant Mass</div>
                  <div className="result-big">{quickCalc().propellantMass} kg</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'mission' && (
          <div className="mission-builder">
            <h2>Mission Builder</h2>
            <div className="mission-controls">
              <select onChange={(e) => e.target.value && addMission(e.target.value)} value="">
                <option value="">Add Mission Leg...</option>
                {Object.keys(COMMON_MANEUVERS).map(key => (
                  <option key={key} value={key}>{COMMON_MANEUVERS[key].name}</option>
                ))}
              </select>
            </div>
            
            <div className="mission-list">
              {missions.map((mission, idx) => (
                <div key={mission.id} className="mission-item">
                  <span className="mission-number">{idx + 1}</span>
                  <span className="mission-name">{mission.name}</span>
                  <span className="mission-deltav">{mission.deltaV} m/s</span>
                  <button className="remove-btn" onClick={() => setMissions(missions.filter((_, i) => i !== idx))}>×</button>
                </div>
              ))}
            </div>
            
            <div className="mission-total">
              <span>Total Delta-V:</span>
              <span className="total-value">{calculateTotalDeltaV()} m/s</span>
            </div>
          </div>
        )}
        
        {activeTab === 'map' && (
          <div className="deltav-map">
            <h2>Solar System Delta-V Map</h2>
            <div className="map-grid">
              {Object.entries(COMMON_MANEUVERS).map(([key, maneuver]) => (
                <div key={key} className="map-item">
                  <div className="map-name">{maneuver.name}</div>
                  <div className="map-value">{maneuver.deltaV} m/s</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeltaVCalculatorWidget;