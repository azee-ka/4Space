import React, { useState } from 'react';
import './styles/TrajectoryPlannerWidget.css';

const TrajectoryPlannerWidget = ({ widget, mode, isCompact }) => {
  const [departure, setDeparture] = useState('earth');
  const [arrival, setArrival] = useState('mars');
  
  if (mode === 'compact' || isCompact) {
    return (
      <div className="trajectory-planner-compact">
        <h3>🛸 Trajectory Planner</h3>
        <div>{departure} → {arrival}</div>
        <div>Transfer time: 259 days</div>
      </div>
    );
  }

  return (
    <div className="trajectory-planner-modal">
      <h2>Interplanetary Trajectory Designer</h2>
      <div className="trajectory-form">
        <label>Departure: <select value={departure} onChange={(e) => setDeparture(e.target.value)}>
          <option value="earth">Earth</option>
          <option value="mars">Mars</option>
        </select></label>
        <label>Arrival: <select value={arrival} onChange={(e) => setArrival(e.target.value)}>
          <option value="mars">Mars</option>
          <option value="jupiter">Jupiter</option>
        </select></label>
        <div className="trajectory-results">
          <div>Transfer Time: 259 days</div>
          <div>Delta-V: 3.6 km/s</div>
        </div>
      </div>
    </div>
  );
};

export default TrajectoryPlannerWidget;