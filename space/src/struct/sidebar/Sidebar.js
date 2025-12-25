import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStream,
    faLayerGroup,
    faChevronDown,
    faCircleNodes
} from '@fortawesome/free-solid-svg-icons';

function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [spaceDropdownOpen, setSpaceDropdownOpen] = useState(false);

    const options = [
        { icon: <FontAwesomeIcon icon={faStream} />, label: 'Home', path: '/', type: 'context' },
        { icon: <FontAwesomeIcon icon={faCircleNodes} />, label: 'Communities', path: '/communities', type: 'context' },
    ];

    // Dynamic sub-apps under "Space"
    const spaceSubApps = [
        { label: 'Space', path: '/space' },
        { label: 'Workspace', path: '/space/workspace' },
        { label: 'Finance / Investing', path: '/space/finance/dashboard' },
    ];

    const handleClick = (e, item) => {
        e.preventDefault();
        if (item.type === 'context') {
            navigate(item.path);
            onClose();
        }
    };

    const handleSpaceClick = (e) => {
        e.preventDefault();
        navigate('/space'); // default
        onClose();
    };

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setSpaceDropdownOpen((prev) => !prev);
    };

    return (
        <div className={`sidebar-container ${isOpen ? '' : 'close'}`} onClick={(e) => e.stopPropagation()}>
            <div className='sidebar-blur-bg'></div>
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

                        {/* Space Dropdown */}
                        <li className='sidebar-menu-item' onClick={handleSpaceClick}>
                            <div className='sidebar-menu-icon'>
                                <FontAwesomeIcon icon={faLayerGroup} />
                            </div>
                            <div className='sidebar-menu--btn-space-group'>
                                <div className='sidebar-menu-label'>Space</div>
                                <div
                                    className={`sidebar-menu-chevron ${spaceDropdownOpen ? 'open' : ''}`}
                                    onClick={toggleDropdown}
                                >
                                    <FontAwesomeIcon icon={faChevronDown} />
                                </div>
                            </div>
                        </li>

                        {/* Animated Dropdown Submenu */}
                        <div className={`sidebar-submenu-wrapper ${spaceDropdownOpen ? 'open' : ''}`}>
                            <div className="sidebar-submenu-line"></div>
                            {spaceSubApps.map((sub, idx) => (
                                <li
                                    key={`sub-${sub.label}-${idx}`}
                                    className='sidebar-submenu-item'
                                    onClick={() => {
                                        navigate(sub.path);
                                        onClose();
                                    }}
                                >
                                    {sub.label}
                                </li>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;