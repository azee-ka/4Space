import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './smallSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faTasks, faHome } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const MechFlowSmallSidebar = ({ }) => {

    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faHome} />, label: 'Home', path: '/stocks', type: 'link' },
        { icon: <FontAwesomeIcon icon={faTasks} />, label: 'Explore', path: '/stocks/explore', type: 'link' },
        { icon: <FontAwesomeIcon icon={faPlus} />, label: 'Uplaod', path: '/stocks/portfolio', type: 'link' },
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
        <div className='mechflow-small-sidebar'>
            <div className='mechflow-small-sidebar-inner'>
                {taskFlow.map((item, index) => (
                    <div
                        key={index}
                        className="mechflow-small-sidebar-item"
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

export default MechFlowSmallSidebar;