import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './appMenu.css';
import {
  FaCog, FaServer, FaUser, FaTasks, FaStream,
  FaImages, FaPlay, FaChartLine, FaChartBar
} from 'react-icons/fa';
import DropdownButton from '../../../utils/popperButton/DropdownButton';

const appsData = [
  { path: '/timeline', label: 'Timeline', icon: <FaStream /> },
  { path: '/timeflow', label: 'TimeFlow', icon: <FaStream /> },
  { path: '/taskflow', label: 'Tasks', icon: <FaTasks /> },
  { path: '/photos', label: 'Photos', icon: <FaImages /> },
  { path: '/spectra', label: 'Spectra', icon: <FaPlay /> },
  { path: '/stocks', label: 'Stocks', icon: <FaChartLine /> },
  { path: '/mechflow', label: 'MechFlow', icon: <FaChartBar /> },
  { path: '/profile', label: 'Profile', icon: <FaUser /> },
  { path: '/settings', label: 'Settings', icon: <FaCog /> },
  { path: '/admin', label: 'Admin Panel', icon: <FaServer /> }
];

const shortcutsData = [
  { path: '/profile', label: 'My Profile', icon: <FaUser /> },
  { path: '/admin', label: 'Admin Panel', icon: <FaServer /> },
  { path: '/photos', label: 'Photos', icon: <FaImages /> },
  { path: '/spectra', label: 'Spectra', icon: <FaPlay /> },
  { path: '/stocks', label: 'Stocks', icon: <FaChartLine /> },
  { path: '/mechflow', label: 'MechFlow', icon: <FaChartBar /> },
  { path: '/settings', label: 'Settings', icon: <FaCog /> }
];

function AppMenuPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('apps');

  const handleTabClick = (tab) => setActiveTab(tab);

  const renderItems = () => {
    const data = activeTab === 'apps' ? appsData : shortcutsData;
    return data.map((app, index) => (
      <div key={index} className='app-item'>
        <Link to={app.path} onClick={onClose}>
          <div className='app-icon'>{app.icon}</div>
          <div className='app-label'>{app.label}</div>
        </Link>
      </div>
    ));
  };

  return (
    <div className='app-menu' onClick={e => e.stopPropagation()}>
      <div className='app-menu-tabs-header'>
        <button
          className={`app-menu-tab ${activeTab === 'apps' ? 'active' : ''}`}
          onClick={() => handleTabClick('apps')}
        >
          Apps
        </button>
        <button
          className={`app-menu-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
          onClick={() => handleTabClick('shortcuts')}
        >
          Shortcuts
        </button>
      </div>
      <hr />
      <div className='apps-grid'>
        {renderItems()}
      </div>
    </div>
  );
}

// --- Main Popper Dropdown Export ---
export default function AppMenu({ toggleContent, placement = 'bottom-end', boundaryRef }) {
  return (
    <DropdownButton
      toggleContent={toggleContent}
      placement={placement}
      boundaryRef={boundaryRef}
    >
      {({ closeDropdown }) => (
        <AppMenuPanel onClose={closeDropdown} />
      )}
    </DropdownButton>
  );
}
