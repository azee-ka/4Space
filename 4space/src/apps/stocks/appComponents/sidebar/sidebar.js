import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faTasks, faChartLine, faHome } from '@fortawesome/free-solid-svg-icons';

function StocksSidebar({ isOpen, onClose }) {
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
        <div className={`stocks-sidebar-container ${isOpen ? '' : 'close'}`} onClick={(e) => e.stopPropagation()}>
            <div className='stocks-sidebar-container-content'>
                <div className='stocks-sidebar-container-content-inner'>
                    <div className='stocks-sidebar-menu'>
                        {options.map((option, index) => (
                            <li 
                            key={`${index}-${option.label}`} 
                            className='stocks-sidebar-menu-item'
                            onClick={() => handleClick(option)}
                            >
                                <div className='stocks-sidebar-menu-icon'>
                                    {option.icon}
                                </div>
                                <div>
                                    {option.type === 'link' ? (
                                        <Link to={option.path} className='stocks-sidebar-menu-link'  onClick={(e) => e.stopPropagation()}>
                                            {option.label}
                                        </Link>
                                    ) : (
                                        <button className='stocks-sidebar-menu-button'>
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

export default StocksSidebar;
