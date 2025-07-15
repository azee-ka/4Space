// strategyPage.jsx

import React from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import './strategyPage.css';

const tabs = [
  { to: '', label: 'Overview' },
  { to: 'code', label: 'Code Editor' },
  { to: 'backtests', label: 'Backtests' },
  { to: 'logs', label: 'Logs' },
  { to: 'metrics', label: 'Metrics' },
];

export default function StrategyPage() {
  const { id } = useParams();
  return (
    <div className="strategy-page">
      <h1 className="strategy-title">Strategy #{id}</h1>
      <nav className="strategy-tabs">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              isActive ? 'strategy-tab active' : 'strategy-tab'
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <div className="strategy-content">
        <Outlet />
      </div>
    </div>
  );
}
