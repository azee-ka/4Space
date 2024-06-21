import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './smallSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const SmallSidebar = ({ setShowCreatePostOverlay }) => {
    
    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faEdit} />, label: 'Create Post', onClick: () => setShowCreatePostOverlay(true), type: 'button' },
        { icon: <ChatBubbleLeftRightIcon className='chat-icon'/>, label: 'Messages', path: '/messages', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCalendar} />, label: 'Calendar', path: '/calendar', type: 'link' },
        { icon: <FontAwesomeIcon icon={faFolder} />, label: 'Categories', path: '/categories', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCog} />, label: 'Settings', path: '/settings', type: 'link' },
    ];

    return (
        <div className='small-sidebar'>
            <div className='small-sidebar-inner'>
                {taskFlow.map((item, index) => (
                    <div key={index} className="small-sidebar-item">
                        {item.type === 'button' ? (
                            <button onClick={item.onClick}>{item.icon}</button>
                        ) : (
                            <Link to={item.path}>{item.icon}</Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

};

export default SmallSidebar;