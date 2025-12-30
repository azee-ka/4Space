// src/features/space/components/apps/MarsColonyPlanner/MarsColonyPlannerWidget.jsx

import React, { useState } from 'react';
import './styles/MarsColonyPlannerWidget.css';
import { 
  FaMountain, FaUsers, FaIndustry, FaBolt, FaWater, FaLeaf,
  FaHome, FaRocket, FaChartLine, FaPlus, FaMinus, FaCalculator,
  FaExclamationTriangle, FaCheckCircle, FaCog, FaDollarSign
} from 'react-icons/fa';

// ============================================
// MARS COLONY DATA & CALCULATIONS
// ============================================

const RESOURCE_REQUIREMENTS = {
  water: { perPerson: 50, unit: 'kg/day', storage: 5000 }, // kg per person per day
  oxygen: { perPerson: 0.84, unit: 'kg/day', storage: 500 },
  food: { perPerson: 0.6, unit: 'kg/day', storage: 10000 },
  power: { perPerson: 10, unit: 'kW', base: 50 }, // kW per person + base
};

const HABITAT_MODULES = [
  {
    id: 'living',
    name: 'Living Quarters',
    capacity: 4,
    mass: 12000,
    volume: 200,
    power: 15,
    description: 'Crew living spaces'
  },
  {
    id: 'lab',
    name: 'Science Lab',
    capacity: 2,
    mass: 8000,
    volume: 120,
    power: 25,
    description: 'Research facility'
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    capacity: 0,
    mass: 15000,
    volume: 300,
    power: 40,
    description: 'Food production'
  },
  {
    id: 'workshop',
    name: 'Workshop',
    capacity: 0,
    mass: 10000,
    volume: 150,
    power: 30,
    description: 'Manufacturing & repair'
  },
  {
    id: 'med',
    name: 'Medical Bay',
    capacity: 2,
    mass: 6000,
    volume: 80,
    power: 20,
    description: 'Healthcare facility'
  }
];

const POWER_SYSTEMS = [
  { id: 'solar', name: 'Solar Arrays', output: 50, mass: 2000, reliability: 0.7, description: 'Photovoltaic panels' },
  { id: 'nuclear', name: 'Nuclear RTG', output: 100, mass: 5000, reliability: 0.95, description: 'Radioisotope thermoelectric' },
  { id: 'reactor', name: 'Fission Reactor', output: 500, mass: 20000, reliability: 0.9, description: 'Compact nuclear reactor' }
];

const LIFE_SUPPORT_SYSTEMS = [
  { id: 'eclss', name: 'ECLSS', capacity: 10, mass: 8000, power: 25, description: 'Environmental Control & Life Support' },
  { id: 'water-recycler', name: 'Water Recycler', capacity: 50, mass: 3000, power: 15, description: 'Water reclamation - 98% efficiency' },
  { id: 'oxygen-gen', name: 'Oxygen Generator', capacity: 20, mass: 4000, power: 30, description: 'Electrolysis system' },
  { id: 'co2-scrubber', name: 'CO2 Scrubber', capacity: 20, mass: 2000, power: 20, description: 'Carbon dioxide removal' }
];

// ============================================
// COMPACT MODE
// ============================================

const MarsColonyPlannerCompact = ({ widget, spaceId }) => {
  const [population, setPopulation] = useState(12);

  const waterNeeded = (population * RESOURCE_REQUIREMENTS.water.perPerson).toFixed(1);
  const oxygenNeeded = (population * RESOURCE_REQUIREMENTS.oxygen.perPerson).toFixed(2);
  const powerNeeded = (population * RESOURCE_REQUIREMENTS.power.perPerson + RESOURCE_REQUIREMENTS.power.base).toFixed(0);

  return (
    <div className="mars-colony-compact">
      <div className="compact-header">
        <FaMountain className="header-icon" />
        <div className="header-content">
          <span className="header-title">Mars Colony</span>
          <span className="header-subtitle">Settlement Planning</span>
        </div>
      </div>

      <div className="compact-population">
        <div className="population-control">
          <button onClick={() => setPopulation(Math.max(1, population - 1))}>
            <FaMinus />
          </button>
          <div className="population-display">
            <FaUsers />
            <span className="population-count">{population}</span>
          </div>
          <button onClick={() => setPopulation(population + 1)}>
            <FaPlus />
          </button>
        </div>
        <span className="population-label">Crew Size</span>
      </div>

      <div className="compact-resources">
        <div className="resource-row">
          <div className="resource-icon-wrapper water">
            <FaWater />
          </div>
          <div className="resource-info">
            <span className="resource-label">Water</span>
            <span className="resource-value">{waterNeeded} kg/day</span>
          </div>
        </div>

        <div className="resource-row">
          <div className="resource-icon-wrapper oxygen">
            <FaLeaf />
          </div>
          <div className="resource-info">
            <span className="resource-label">Oxygen</span>
            <span className="resource-value">{oxygenNeeded} kg/day</span>
          </div>
        </div>

        <div className="resource-row">
          <div className="resource-icon-wrapper power">
            <FaBolt />
          </div>
          <div className="resource-info">
            <span className="resource-label">Power</span>
            <span className="resource-value">{powerNeeded} kW</span>
          </div>
        </div>
      </div>

      <div className="compact-action-hint">
        <span>Click to open colony planner</span>
      </div>
    </div>
  );
};

// ============================================
// MODAL MODE - Full Colony Planner
// ============================================

const MarsColonyPlannerModal = ({ widget, spaceId }) => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, habitat, resources, timeline
  const [colonyName, setColonyName] = useState('Olympus Base');
  const [population, setPopulation] = useState(24);
  const [habitatModules, setHabitatModules] = useState([
    { ...HABITAT_MODULES[0], count: 6, id: 'living-1' },
    { ...HABITAT_MODULES[1], count: 2, id: 'lab-1' },
    { ...HABITAT_MODULES[2], count: 2, id: 'greenhouse-1' }
  ]);
  const [powerSystems, setPowerSystems] = useState([
    { ...POWER_SYSTEMS[1], count: 2, id: 'nuclear-1' },
    { ...POWER_SYSTEMS[0], count: 10, id: 'solar-1' }
  ]);
  const [lifeSupportSystems, setLifeSupportSystems] = useState([
    { ...LIFE_SUPPORT_SYSTEMS[0], count: 3, id: 'eclss-1' },
    { ...LIFE_SUPPORT_SYSTEMS[1], count: 2, id: 'water-1' }
  ]);

  // Calculate colony metrics
  const calculateMetrics = () => {
    const totalHabitatCapacity = habitatModules.reduce((sum, mod) => sum + (mod.capacity * mod.count), 0);
    const totalVolume = habitatModules.reduce((sum, mod) => sum + (mod.volume * mod.count), 0);
    const totalMass = [
      ...habitatModules.map(m => m.mass * m.count),
      ...powerSystems.map(p => p.mass * p.count),
      ...lifeSupportSystems.map(l => l.mass * l.count)
    ].reduce((sum, m) => sum + m, 0);
    
    const powerGeneration = powerSystems.reduce((sum, sys) => sum + (sys.output * sys.count), 0);
    const powerConsumption = 
      habitatModules.reduce((sum, mod) => sum + (mod.power * mod.count), 0) +
      lifeSupportSystems.reduce((sum, sys) => sum + (sys.power * sys.count), 0) +
      (population * RESOURCE_REQUIREMENTS.power.perPerson);
    
    const lifeSupportCapacity = lifeSupportSystems.reduce((sum, sys) => sum + (sys.capacity * sys.count), 0);
    
    const waterNeeded = population * RESOURCE_REQUIREMENTS.water.perPerson;
    const oxygenNeeded = population * RESOURCE_REQUIREMENTS.oxygen.perPerson;
    const foodNeeded = population * RESOURCE_REQUIREMENTS.food.perPerson;

    return {
      totalHabitatCapacity,
      totalVolume,
      totalMass,
      powerGeneration,
      powerConsumption,
      powerMargin: powerGeneration - powerConsumption,
      lifeSupportCapacity,
      waterNeeded,
      oxygenNeeded,
      foodNeeded
    };
  };

  const metrics = calculateMetrics();

  // Calculate alerts
  const alerts = [];
  if (population > metrics.totalHabitatCapacity) {
    alerts.push({ type: 'error', message: `Insufficient habitat capacity: ${population}/${metrics.totalHabitatCapacity} people` });
  }
  if (metrics.powerMargin < 0) {
    alerts.push({ type: 'error', message: `Power deficit: ${Math.abs(metrics.powerMargin).toFixed(0)} kW` });
  }
  if (population > metrics.lifeSupportCapacity) {
    alerts.push({ type: 'warning', message: `Life support at capacity: ${population}/${metrics.lifeSupportCapacity} people` });
  }
  if (metrics.powerMargin < 50 && metrics.powerMargin >= 0) {
    alerts.push({ type: 'warning', message: `Low power margin: ${metrics.powerMargin.toFixed(0)} kW` });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'success', message: 'Colony systems nominal' });
  }

  return (
    <div className="mars-colony-modal">
      {/* Left Sidebar - Colony Overview */}
      <div className="mars-sidebar">
        <div className="sidebar-header">
          <h3>Colony Overview</h3>
        </div>

        <div className="sidebar-section">
          <label>Colony Name</label>
          <input
            type="text"
            value={colonyName}
            onChange={(e) => setColonyName(e.target.value)}
            className="colony-name-input"
          />
        </div>

        <div className="sidebar-section">
          <label>Population</label>
          <div className="population-control-full">
            <button onClick={() => setPopulation(Math.max(1, population - 1))}>
              <FaMinus />
            </button>
            <input
              type="number"
              value={population}
              onChange={(e) => setPopulation(parseInt(e.target.value) || 0)}
              min="0"
            />
            <button onClick={() => setPopulation(population + 1)}>
              <FaPlus />
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <h4>Colony Metrics</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <FaHome className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">{metrics.totalHabitatCapacity}</span>
                <span className="metric-label">Capacity</span>
              </div>
            </div>

            <div className="metric-card">
              <FaBolt className="metric-icon power" />
              <div className="metric-content">
                <span className="metric-value">{metrics.powerGeneration.toFixed(0)}</span>
                <span className="metric-label">kW Power</span>
              </div>
            </div>

            <div className="metric-card">
              <FaRocket className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">{(metrics.totalMass / 1000).toFixed(1)}</span>
                <span className="metric-label">Tonnes</span>
              </div>
            </div>

            <div className="metric-card">
              <FaCog className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">{metrics.lifeSupportCapacity}</span>
                <span className="metric-label">Life Support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h4>System Status</h4>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert-item ${alert.type}`}>
                {alert.type === 'error' && <FaExclamationTriangle />}
                {alert.type === 'warning' && <FaExclamationTriangle />}
                {alert.type === 'success' && <FaCheckCircle />}
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="sidebar-action-btn">
          <FaCalculator />
          Calculate Missions
        </button>
      </div>

      {/* Main Content */}
      <div className="mars-main">
        <div className="mars-tabs">
          <button
            className={`mars-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartLine />
            Overview
          </button>
          <button
            className={`mars-tab ${activeTab === 'habitat' ? 'active' : ''}`}
            onClick={() => setActiveTab('habitat')}
          >
            <FaHome />
            Habitat
          </button>
          <button
            className={`mars-tab ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            <FaBolt />
            Resources
          </button>
          <button
            className={`mars-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <FaRocket />
            Missions
          </button>
        </div>

        <div className="mars-content">
          {activeTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              population={population}
            />
          )}

          {activeTab === 'habitat' && (
            <HabitatView
              habitatModules={habitatModules}
              setHabitatModules={setHabitatModules}
              metrics={metrics}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesView
              powerSystems={powerSystems}
              setPowerSystems={setPowerSystems}
              lifeSupportSystems={lifeSupportSystems}
              setLifeSupportSystems={setLifeSupportSystems}
              metrics={metrics}
              population={population}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView
              population={population}
              metrics={metrics}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// VIEW COMPONENTS
// ============================================

const OverviewView = ({ metrics, population }) => {
  return (
    <div className="overview-view">
      <div className="overview-header">
        <h3>Colony Dashboard</h3>
        <span className="population-badge">
          <FaUsers />
          {population} Colonists
        </span>
      </div>

      <div className="overview-cards">
        <div className="overview-card power">
          <div className="card-header">
            <FaBolt />
            <h4>Power Systems</h4>
          </div>
          <div className="card-content">
            <div className="large-metric">
              <span className="value">{metrics.powerGeneration.toFixed(0)}</span>
              <span className="unit">kW Generated</span>
            </div>
            <div className="sub-metrics">
              <div className="sub-metric">
                <span className="label">Consumption</span>
                <span className="value">{metrics.powerConsumption.toFixed(0)} kW</span>
              </div>
              <div className="sub-metric">
                <span className="label">Margin</span>
                <span className={`value ${metrics.powerMargin < 0 ? 'negative' : 'positive'}`}>
                  {metrics.powerMargin.toFixed(0)} kW
                </span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min(100, (metrics.powerConsumption / metrics.powerGeneration) * 100)}%`,
                  background: metrics.powerMargin < 0 ? '#ef4444' : '#10b981'
                }}
              />
            </div>
          </div>
        </div>

        <div className="overview-card habitat">
          <div className="card-header">
            <FaHome />
            <h4>Habitat</h4>
          </div>
          <div className="card-content">
            <div className="large-metric">
              <span className="value">{metrics.totalHabitatCapacity}</span>
              <span className="unit">Capacity</span>
            </div>
            <div className="sub-metrics">
              <div className="sub-metric">
                <span className="label">Occupied</span>
                <span className="value">{population} people</span>
              </div>
              <div className="sub-metric">
                <span className="label">Volume</span>
                <span className="value">{metrics.totalVolume.toFixed(0)} m³</span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min(100, (population / metrics.totalHabitatCapacity) * 100)}%`,
                  background: population > metrics.totalHabitatCapacity ? '#ef4444' : '#3b82f6'
                }}
              />
            </div>
          </div>
        </div>

        <div className="overview-card resources">
          <div className="card-header">
            <FaWater />
            <h4>Daily Resource Needs</h4>
          </div>
          <div className="card-content">
            <div className="resource-list">
              <div className="resource-item">
                <span className="resource-name">Water</span>
                <span className="resource-amount">{metrics.waterNeeded.toFixed(1)} kg/day</span>
              </div>
              <div className="resource-item">
                <span className="resource-name">Oxygen</span>
                <span className="resource-amount">{metrics.oxygenNeeded.toFixed(2)} kg/day</span>
              </div>
              <div className="resource-item">
                <span className="resource-name">Food</span>
                <span className="resource-amount">{metrics.foodNeeded.toFixed(1)} kg/day</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card mass">
          <div className="card-header">
            <FaRocket />
            <h4>Total Colony Mass</h4>
          </div>
          <div className="card-content">
            <div className="large-metric">
              <span className="value">{(metrics.totalMass / 1000).toFixed(1)}</span>
              <span className="unit">Tonnes</span>
            </div>
            <div className="sub-metrics">
              <div className="sub-metric">
                <span className="label">Missions Required</span>
                <span className="value">{Math.ceil(metrics.totalMass / 100000)}</span>
              </div>
              <div className="sub-metric">
                <span className="label">Cost Estimate</span>
                <span className="value">${((metrics.totalMass / 1000) * 5).toFixed(0)}M</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HabitatView = ({ habitatModules, setHabitatModules, metrics }) => {
  const handleAddModule = (module) => {
    const newModule = { ...module, count: 1, id: `${module.id}-${Date.now()}` };
    setHabitatModules([...habitatModules, newModule]);
  };

  const handleUpdateCount = (id, delta) => {
    setHabitatModules(habitatModules.map(mod =>
      mod.id === id ? { ...mod, count: Math.max(0, mod.count + delta) } : mod
    ).filter(mod => mod.count > 0));
  };

  return (
    <div className="habitat-view">
      <div className="view-header">
        <h3>Habitat Configuration</h3>
        <div className="habitat-summary">
          <span>Total Capacity: {metrics.totalHabitatCapacity} people</span>
          <span>Total Volume: {metrics.totalVolume} m³</span>
        </div>
      </div>

      <div className="modules-grid">
        {habitatModules.map(mod => (
          <div key={mod.id} className="module-card">
            <div className="module-header">
              <h4>{mod.name}</h4>
              <span className="module-count">×{mod.count}</span>
            </div>
            <p className="module-desc">{mod.description}</p>
            <div className="module-stats">
              <div className="stat">
                <span>Capacity</span>
                <span>{mod.capacity * mod.count} people</span>
              </div>
              <div className="stat">
                <span>Power</span>
                <span>{mod.power * mod.count} kW</span>
              </div>
              <div className="stat">
                <span>Mass</span>
                <span>{(mod.mass * mod.count / 1000).toFixed(1)} t</span>
              </div>
            </div>
            <div className="module-controls">
              <button onClick={() => handleUpdateCount(mod.id, -1)}>
                <FaMinus />
              </button>
              <span>{mod.count}</span>
              <button onClick={() => handleUpdateCount(mod.id, 1)}>
                <FaPlus />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="available-modules">
        <h4>Available Modules</h4>
        <div className="modules-list">
          {HABITAT_MODULES.map(mod => (
            <button
              key={mod.id}
              className="add-module-btn"
              onClick={() => handleAddModule(mod)}
            >
              <FaPlus />
              {mod.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResourcesView = ({ powerSystems, setPowerSystems, lifeSupportSystems, setLifeSupportSystems, metrics, population }) => {
  const handleAddPowerSystem = (system) => {
    const newSystem = { ...system, count: 1, id: `${system.id}-${Date.now()}` };
    setPowerSystems([...powerSystems, newSystem]);
  };

  const handleUpdatePowerCount = (id, delta) => {
    setPowerSystems(powerSystems.map(sys =>
      sys.id === id ? { ...sys, count: Math.max(0, sys.count + delta) } : sys
    ).filter(sys => sys.count > 0));
  };

  const handleAddLifeSupport = (system) => {
    const newSystem = { ...system, count: 1, id: `${system.id}-${Date.now()}` };
    setLifeSupportSystems([...lifeSupportSystems, newSystem]);
  };

  const handleUpdateLifeSupportCount = (id, delta) => {
    setLifeSupportSystems(lifeSupportSystems.map(sys =>
      sys.id === id ? { ...sys, count: Math.max(0, sys.count + delta) } : sys
    ).filter(sys => sys.count > 0));
  };

  return (
    <div className="resources-view">
      <div className="resources-section">
        <h3>Power Generation</h3>
        <div className="power-summary">
          <div className="summary-item">
            <span className="label">Total Output</span>
            <span className="value">{metrics.powerGeneration.toFixed(0)} kW</span>
          </div>
          <div className="summary-item">
            <span className="label">Consumption</span>
            <span className="value">{metrics.powerConsumption.toFixed(0)} kW</span>
          </div>
          <div className="summary-item">
            <span className="label">Margin</span>
            <span className={`value ${metrics.powerMargin < 0 ? 'negative' : 'positive'}`}>
              {metrics.powerMargin.toFixed(0)} kW
            </span>
          </div>
        </div>

        <div className="systems-grid">
          {powerSystems.map(sys => (
            <div key={sys.id} className="system-card">
              <div className="system-header">
                <FaBolt />
                <h4>{sys.name}</h4>
              </div>
              <p className="system-desc">{sys.description}</p>
              <div className="system-stats">
                <div className="stat">
                  <span>Output</span>
                  <span>{sys.output * sys.count} kW</span>
                </div>
                <div className="stat">
                  <span>Reliability</span>
                  <span>{(sys.reliability * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="system-controls">
                <button onClick={() => handleUpdatePowerCount(sys.id, -1)}>
                  <FaMinus />
                </button>
                <span>×{sys.count}</span>
                <button onClick={() => handleUpdatePowerCount(sys.id, 1)}>
                  <FaPlus />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="add-system-section">
          <h5>Add Power System</h5>
          <div className="add-buttons">
            {POWER_SYSTEMS.map(sys => (
              <button
                key={sys.id}
                className="add-system-btn"
                onClick={() => handleAddPowerSystem(sys)}
              >
                <FaPlus />
                {sys.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="resources-section">
        <h3>Life Support Systems</h3>
        <div className="life-support-summary">
          <div className="summary-item">
            <span className="label">Capacity</span>
            <span className="value">{metrics.lifeSupportCapacity} people</span>
          </div>
          <div className="summary-item">
            <span className="label">Population</span>
            <span className="value">{population} people</span>
          </div>
        </div>

        <div className="systems-grid">
          {lifeSupportSystems.map(sys => (
            <div key={sys.id} className="system-card">
              <div className="system-header">
                <FaLeaf />
                <h4>{sys.name}</h4>
              </div>
              <p className="system-desc">{sys.description}</p>
              <div className="system-stats">
                <div className="stat">
                  <span>Capacity</span>
                  <span>{sys.capacity * sys.count} people</span>
                </div>
                <div className="stat">
                  <span>Power</span>
                  <span>{sys.power * sys.count} kW</span>
                </div>
              </div>
              <div className="system-controls">
                <button onClick={() => handleUpdateLifeSupportCount(sys.id, -1)}>
                  <FaMinus />
                </button>
                <span>×{sys.count}</span>
                <button onClick={() => handleUpdateLifeSupportCount(sys.id, 1)}>
                  <FaPlus />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="add-system-section">
          <h5>Add Life Support</h5>
          <div className="add-buttons">
            {LIFE_SUPPORT_SYSTEMS.map(sys => (
              <button
                key={sys.id}
                className="add-system-btn"
                onClick={() => handleAddLifeSupport(sys)}
              >
                <FaPlus />
                {sys.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineView = ({ population, metrics }) => {
  const missionsRequired = Math.ceil(metrics.totalMass / 100000);
  const missionCost = 500; // Million USD per mission
  const totalCost = missionsRequired * missionCost;

  return (
    <div className="timeline-view">
      <h3>Mission Planning</h3>

      <div className="mission-summary-cards">
        <div className="mission-card">
          <FaRocket />
          <div className="mission-content">
            <span className="mission-value">{missionsRequired}</span>
            <span className="mission-label">Cargo Missions</span>
          </div>
        </div>

        <div className="mission-card">
          <FaDollarSign />
          <div className="mission-content">
            <span className="mission-value">${totalCost}M</span>
            <span className="mission-label">Estimated Cost</span>
          </div>
        </div>

        <div className="mission-card">
          <FaUsers />
          <div className="mission-content">
            <span className="mission-value">{Math.ceil(population / 6)}</span>
            <span className="mission-label">Crew Missions</span>
          </div>
        </div>
      </div>

      <div className="mission-timeline">
        <h4>Suggested Mission Sequence</h4>
        <div className="timeline-list">
          {[...Array(missionsRequired)].map((_, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-marker">{i + 1}</div>
              <div className="timeline-content">
                <h5>Cargo Mission {i + 1}</h5>
                <p>Deliver 100 tonnes of equipment and supplies</p>
                <span className="timeline-date">T+{(i * 26).toFixed(0)} months</span>
              </div>
            </div>
          ))}
          <div className="timeline-item crew">
            <div className="timeline-marker">
              <FaUsers />
            </div>
            <div className="timeline-content">
              <h5>First Crew Mission</h5>
              <p>Deploy initial crew of 6 colonists</p>
              <span className="timeline-date">T+{(missionsRequired * 26).toFixed(0)} months</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN EXPORT
// ============================================

const MarsColonyPlannerWidget = ({ widget, mode = 'full', isCompact, spaceId }) => {
  if (mode === 'compact' || isCompact) {
    return <MarsColonyPlannerCompact widget={widget} spaceId={spaceId} />;
  }
  
  return <MarsColonyPlannerModal widget={widget} spaceId={spaceId} />;
};

export default MarsColonyPlannerWidget;