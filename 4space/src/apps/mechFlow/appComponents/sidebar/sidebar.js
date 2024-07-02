import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faTasks, faChartLine, faHome } from '@fortawesome/free-solid-svg-icons';

function MechFlowSidebar({ isOpen, onClose }) {
    const navigate = useNavigate();

    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faHome} />, label: 'Home', path: '/stocks', type: 'link' },
        { icon: <FontAwesomeIcon icon={faTasks} />, label: 'Explore', path: '/stocks/explore', type: 'link' },
        { icon: <FontAwesomeIcon icon={faPlus} />, label: 'Uplaod', path: '/stocks/upload', type: 'link' },
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
        <div className={`mechflow-sidebar-container ${isOpen ? '' : 'close'}`} onClick={(e) => e.stopPropagation()}>
            <div className='mechflow-sidebar-container-content'>
                <div className='mechflow-sidebar-container-content-inner'>
                    <div className='mechflow-sidebar-menu'>
                        {options.map((option, index) => (
                            <li 
                            key={`${index}-${option.label}`} 
                            className='mechflow-sidebar-menu-item'
                            onClick={() => handleClick(option)}
                            >
                                <div className='mechflow-sidebar-menu-icon'>
                                    {option.icon}
                                </div>
                                <div>
                                    {option.type === 'link' ? (
                                        <Link to={option.path} className='mechflow-sidebar-menu-link'  onClick={(e) => e.stopPropagation()}>
                                            {option.label}
                                        </Link>
                                    ) : (
                                        <button className='mechflow-sidebar-menu-button'>
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

export default MechFlowSidebar;
