import React, { useState } from 'react';
import { faGear, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import './profileMenuSidebar.css';

const ProfileMenuSidebar = () => {
    const menuBtns = [
        { icon: <FontAwesomeIcon icon={faGear} />, label: 'Settings', path: '/settings#account-settings-restrictions', type: 'link' },
        { icon: <FontAwesomeIcon icon={faUser} />, label: 'Profile', path: '/settings#profile-basic-info', type: 'link' },
    ];

    return (
        <div className="sidebar-profile-menu">
            {menuBtns.map((item, index) => (
                <div key={index} className="sidebar-profile-menu-item">
                    {item.type === 'button' ? (
                        <button>{item.icon}</button>
                    ) : (
                        <Link to={item.path} onClick={(e) => e.stopPropagation()}>
                            {item.icon}
                            {item.label && <div className="sidebar-profile-menu-item-label">{item.label}</div>}
                            </Link>
                    )}
                </div>
            ))}
        </div>
    );
}

export default ProfileMenuSidebar;