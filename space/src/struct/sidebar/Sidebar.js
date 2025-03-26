import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCog, faStream, faLayerGroup, faSearch } from '@fortawesome/free-solid-svg-icons';

function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();

    const options = [
        { icon: <FontAwesomeIcon icon={faStream} />, label: 'Central', path: '/', type: 'context' },
        { icon: <FontAwesomeIcon icon={faStream} />, label: 'AxionSpace', path: '/axionspace', type: 'context' },
        { icon: <FontAwesomeIcon icon={faLayerGroup} />, label: 'QuantaSpace', path: '/quantaspace', type: 'context' },
        { icon: <FontAwesomeIcon icon={faCog} />, label: 'RadianSpace', path: '/radianspace', type: 'context' },
    ];


    const handleClick = (e, item) => {
        e.preventDefault()
        if (item.type === 'button') {
            if (typeof item.onClick === 'function') {
                item.onClick();
            }
        } else if (item.type === 'link') {
            navigate(item.path);
        } else if (item.type === 'context') {
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
                                onClick={(e) => handleClick(e, option)}
                            >
                                <div className='sidebar-menu-icon'>
                                    {option.icon}
                                </div>
                                <div className='sidebar-menu-label'>
                                    {option.label}
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
