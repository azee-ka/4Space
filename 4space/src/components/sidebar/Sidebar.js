import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ isOpen, onClose, setShowCreatePostOverlay }) {
    const taskFlow = [
        { label: 'Create Post', onClick: () => setShowCreatePostOverlay(true), type: 'button' },
        { label: 'Add Task', path: '/add-task', type: 'link' },
        { label: 'Calendar', path: '/calendar', type: 'link' },
        { label: 'Categories', path: '/categories', type: 'link' },
        { label: 'Settings', path: '/settings', type: 'link' },
    ];

    const [options] = useState(taskFlow);

    return (
        <div className={`sidebar-container ${isOpen ? '' : 'close'}`} onClick={(e) => e.stopPropagation()}>
            <div className='sidebar-container-content'>
                <div className='sidebar-container-content-inner'>
                    <div className='sidebar-menu'>
                        {options.map((option, index) => (
                            <li key={`${index}-${option.label}`} className='sidebar-menu-item'>
                                <div>
                                    {option.type === 'link' ? (
                                        <Link to={option.path} className='sidebar-menu-link' onClick={onClose}>
                                            {option.label}
                                        </Link>
                                    ) : (
                                        <button className='sidebar-menu-button' onClick={() => { option.onClick(); onClose(); }}>
                                            {option.label}
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
