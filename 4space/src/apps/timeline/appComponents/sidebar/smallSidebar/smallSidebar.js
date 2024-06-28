import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './smallSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faStream, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const SmallSidebar = ({ handleShowCreatePostOverlayClick }) => {
    
    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faStream} />, label: 'Timeline', path: '/timeline', type: 'link' },
        { icon: <FontAwesomeIcon icon={faLayerGroup} />, label: 'Explore', path: '/timeline/explore', type: 'link' },
        { icon: <FontAwesomeIcon icon={faEdit} />, label: 'Create Post', onClick: () => handleShowCreatePostOverlayClick(window.location.pathname), type: 'button' },
        { icon: <ChatBubbleLeftRightIcon className='chat-icon' />, label: 'Messages', path: '/timeline/messages', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCog} />, label: 'Settings', path: '/timeline/preferences', type: 'link' },
    ];

    const navigate = useNavigate();

    const handleClick = (item) => {
        console.log("butns")
        if (item.type === 'button') {
            if (typeof item.onClick === 'function') {
                item.onClick();
            }
        } else if (item.type === 'link') {
            navigate(item.path);
        }
    };


    return (
        <div className='small-sidebar'>
            <div className='small-sidebar-inner'>
                {taskFlow.map((item, index) => (
                    <div
                        key={index}
                        className="small-sidebar-item"
                        onClick={() => handleClick(item)}
                    >
                        {item.type === 'button' ? (
                            <button>{item.icon}</button>
                        ) : (
                            <Link to={item.path} onClick={(e) => e.stopPropagation()}>{item.icon}</Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

};

export default SmallSidebar;