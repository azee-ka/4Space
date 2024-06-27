import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faStream } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

function Sidebar({ isOpen, onClose, setShowCreatePostOverlay }) {
    const navigate = useNavigate();

    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faStream} />, label: 'Timeline', path: '/timeline', type: 'link' },
        { icon: <FontAwesomeIcon icon={faEdit} />, label: 'Create Post', onClick: () => setShowCreatePostOverlay(true), type: 'button' },
        { icon: <ChatBubbleLeftRightIcon className='chat-icon'/>, label: 'Messages', path: '/timeline/messages', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCog} />, label: 'Settings', path: '/timeline/preferences', type: 'link' },
    ];

    const [options] = useState(taskFlow);

    const handleClick = (item) => {
        if (item.type === 'button') {
            if (typeof item.onClick === 'function') {
                item.onClick();
            }
        } else if (item.type === 'link') {
            navigate(item.path);
        }
        onClose();
    };

    return (
        <div className={`sidebar-container ${isOpen ? '' : 'close'}`} onClick={(e) => e.stopPropagation()}>
            <div className='sidebar-container-content'>
                <div className='sidebar-container-content-inner'>
                    <div className='sidebar-menu'>
                        {options.map((option, index) => (
                            <li 
                            key={`${index}-${option.label}`} 
                            className='sidebar-menu-item'
                            onClick={() => handleClick(option)}
                            >
                                <div className='sidebar-menu-icon'>
                                    {option.icon}
                                </div>
                                <div>
                                    {option.type === 'link' ? (
                                        <Link to={option.path} className='sidebar-menu-link' onClick={(e) => e.stopPropagation()}>
                                            {option.label}
                                        </Link>
                                    ) : (
                                        <button className='sidebar-menu-button'>
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
