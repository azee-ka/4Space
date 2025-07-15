// livePage.jsx

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './livePage.css';

const tabs = [
  { to: '', label: 'Deploy' },
  { to: 'monitor', label: 'Monitor' },
  { to: 'broker-settings', label: 'Broker Settings' },
  { to: 'alerts', label: 'Alerts' },
];

export default function LivePage() {
  return (
    <div className="live-page">
      <nav className="live-tabs">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              isActive ? 'live-tab active' : 'live-tab'
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <div className="live-content">
        <Outlet />
      </div>
    </div>
  );
}
