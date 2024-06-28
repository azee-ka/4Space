import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faTasks } from '@fortawesome/free-solid-svg-icons';

function SpectraSidebar({ isOpen, onClose }) {
    const navigate = useNavigate();

    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faTasks} />, label: 'Tasks', path: '/taskflow', type: 'link' },
        { icon: <FontAwesomeIcon icon={faPlus} />, label: 'Add Task', path: '/taskflow/add-task', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCalendar} />, label: 'Calendar', path: '/taskflow/calendar', type: 'link' },
        { icon: <FontAwesomeIcon icon={faFolder} />, label: 'Categories', path: '/taskflow/categories', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCog} />, label: 'Settings', path: '/taskflow/settings', type: 'link' },
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
        <div className={`spectra-sidebar-container ${isOpen ? '' : 'close'}`} onClick={(e) => e.stopPropagation()}>
            <div className='spectra-sidebar-container-content'>
                <div className='spectra-sidebar-container-content-inner'>
                    <div className='spectra-sidebar-menu'>
                        {options.map((option, index) => (
                            <li 
                            key={`${index}-${option.label}`} 
                            className='spectra-sidebar-menu-item'
                            onClick={() => handleClick(option)}
                            >
                                <div className='spectra-sidebar-menu-icon'>
                                    {option.icon}
                                </div>
                                <div>
                                    {option.type === 'link' ? (
                                        <Link to={option.path} className='spectra-sidebar-menu-link'  onClick={(e) => e.stopPropagation()}>
                                            {option.label}
                                        </Link>
                                    ) : (
                                        <button className='spectra-sidebar-menu-button'>
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

export default SpectraSidebar;
