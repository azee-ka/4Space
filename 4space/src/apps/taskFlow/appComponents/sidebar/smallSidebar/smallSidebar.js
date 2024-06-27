import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './smallSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faTasks, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const TaskFlowSmallSidebar = ({ setShowCreatePostOverlay }) => {

    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faChartLine} />, label: 'Tasks', path: '/taskflow', type: 'link' },
        { icon: <FontAwesomeIcon icon={faTasks} />, label: 'Tasks', path: '/taskflow/tasks', type: 'link' },
        { icon: <FontAwesomeIcon icon={faPlus} />, label: 'Add Task', path: '/taskflow/add-task', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCalendar} />, label: 'Calendar', path: '/taskflow/calendar', type: 'link' },
        { icon: <FontAwesomeIcon icon={faFolder} />, label: 'Categories', path: '/taskflow/categories', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCog} />, label: 'Settings', path: '/taskflow/settings', type: 'link' },
    ];

    const navigate = useNavigate();

    const handleClick = (item) => {
        if (item.type === 'button') {
            if (typeof item.onClick === 'function') {
                item.onClick();
            }
        } else if (item.type === 'link') {
            navigate(item.path);
        }
    };

    return (
        <div className='taskflow-small-sidebar'>
            <div className='taskflow-small-sidebar-inner'>
                {taskFlow.map((item, index) => (
                    <div
                        key={index}
                        className="taskflow-small-sidebar-item"
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

export default TaskFlowSmallSidebar;