import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const PhotosSidebar = () => {

    const navigate = useNavigate();

    const options = [
        { icon: <FontAwesomeIcon icon={faCalendar} />, label: 'Photos', path: '/photos', type: 'link' },
        { icon: <FontAwesomeIcon icon={faFolder} />, label: 'Albums', path: '/photos/albums', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCog} />, label: 'Settings', path: '/photos/settings', type: 'link' },
    ];

    const handleRedirect = (path) => {
        navigate(path);
    }

    return (
        <div className={`photos-sidebar-container`} onClick={(e) => e.stopPropagation()}>
            <div className='photos-sidebar-container-content'>
                <div className='photos-sidebar-container-content-inner'>
                    <div className='photos-sidebar-menu'>
                        {options.map((option, index) => (
                            <li key={`${index}-${option.label}`} className='photos-sidebar-menu-item' onClick={() => handleRedirect(option.path)}>
                                <div className='photos-sidebar-menu-item-inner'>
                                    <div className='photos-sidebar-menu-icon'>
                                        {option.icon}
                                    </div>
                                    <p>{option.label}</p>
                                </div>
                            </li>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotosSidebar;