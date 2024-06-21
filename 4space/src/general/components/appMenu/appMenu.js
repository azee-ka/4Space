import React from 'react';
import { Link } from 'react-router-dom';
import './appMenu.css';
import { FaCog, FaServer, FaUser } from 'react-icons/fa'; // Example icons

const appsData = [
    { path: '/tasks', label: 'Tasks', icon: <FaCog /> },
    { path: '/servers', label: 'Servers', icon: <FaServer /> },
    { path: '/photos', label: 'Photos', icon: <FaUser /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
];

const AppMenu = () => {

    return (
        <div className='app-menu' onClick={(e) => e.stopPropagation()}>
            <div className='app-menu-inner'>
                <div className='apps-grid'>
                    {appsData.map((app, index) => (
                        <div key={index} className='app-item'>
                            <Link to={app.path}>
                                <div className='app-icon'>{app.icon}</div>
                                <div className='app-label'>{app.label}</div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AppMenu;
