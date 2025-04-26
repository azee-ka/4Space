import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './appMenu.css';
import { FaCog, FaServer, FaUser, FaTasks, FaStream, FaImages, FaPlay, FaChartLine, FaDashcube, FaChartBar } from 'react-icons/fa'; // Example icons
import { faStream } from '@fortawesome/free-solid-svg-icons';

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

    { path: '/admin', label: 'Admin Panel', icon: <FaServer /> },
    { path: '/photos', label: 'Photos', icon: <FaImages /> },
    { path: '/spectra', label: 'Spectra', icon: <FaPlay /> },
    { path: '/stocks', label: 'Stocks', icon: <FaChartLine /> },
    { path: '/mechflow', label: 'MechFlow', icon: <FaChartBar /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> },
];

const shortcutsData = [
    { path: '/profile', label: 'My Profile', icon: <FaUser /> },
    { path: '/admin', label: 'Admin Panel', icon: <FaServer /> },
    { path: '/photos', label: 'Photos', icon: <FaImages /> },
    { path: '/spectra', label: 'Spectra', icon: <FaPlay /> },
    { path: '/stocks', label: 'Stocks', icon: <FaChartLine /> },
    { path: '/mechflow', label: 'MechFlow', icon: <FaChartBar /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> },

    { path: '/admin', label: 'Admin Panel', icon: <FaServer /> },
    { path: '/photos', label: 'Photos', icon: <FaImages /> },
    { path: '/spectra', label: 'Spectra', icon: <FaPlay /> },
    { path: '/stocks', label: 'Stocks', icon: <FaChartLine /> },
    { path: '/mechflow', label: 'MechFlow', icon: <FaChartBar /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> },
];

const AppMenu = () => {
    const [activeTab, setActiveTab] = useState('apps');

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const renderItems = () => {
        const data = activeTab === 'apps' ? appsData : shortcutsData;
        return data.map((app, index) => (
            <div key={index} className='app-item'>
                <Link to={app.path}>
                    <div className='app-icon'>{app.icon}</div>
                    <div className='app-label'>{app.label}</div>
                </Link>
            </div>
        ));
    };

    return (
        <div className='app-menu' onClick={(e) => e.stopPropagation()}>
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
            <hr/>
            <div className='apps-grid'>
                {renderItems()}
            </div>
        </div>
    );
}

export default AppMenu;
