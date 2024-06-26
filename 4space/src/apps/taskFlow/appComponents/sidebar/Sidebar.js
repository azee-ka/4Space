import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faTasks } from '@fortawesome/free-solid-svg-icons';

function TaskFlowSidebar({ isOpen, onClose }) {
    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faTasks} />, label: 'Tasks', path: '/taskflow', type: 'link' },
        { icon: <FontAwesomeIcon icon={faPlus} />, label: 'Add Task', path: '/taskflow/add-task', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCalendar} />, label: 'Calendar', path: '/taskflow/calendar', type: 'link' },
        { icon: <FontAwesomeIcon icon={faFolder} />, label: 'Categories', path: '/taskflow/categories', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCog} />, label: 'Settings', path: '/taskflow/settings', type: 'link' },
    ];

    const [options] = useState(taskFlow);

    return (
        <div className={`sidebar-container ${isOpen ? '' : 'close'}`} onClick={(e) => e.stopPropagation()}>
            <div className='sidebar-container-content'>
                <div className='sidebar-container-content-inner'>
                    <div className='sidebar-menu'>
                        {options.map((option, index) => (
                            <li key={`${index}-${option.label}`} className='sidebar-menu-item'>
                                <div className='sidebar-menu-icon'>
                                    {option.icon}
                                </div>
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

export default TaskFlowSidebar;
