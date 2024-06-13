import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavigationBar.css';
import { useAuthDispatch, useAuthState } from '../Authentication/utils/AuthProvider';
import Sidebar from '../../sidebar/Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTh, faBell } from '@fortawesome/free-solid-svg-icons'; // Import the grid icon
import API_BASE_URL from '../../../config';

import Menubar from '../menubar/menubar';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import NineDotIcon from '../../../utils/icons/nine-dot';
import AppMenu from '../appMenu/appMenu';
import SidebarMenuIcon from '../../../utils/icons/sidebar-menu-icon/sidebar-menu-icon';
import GetConfig from '../Authentication/utils/config';

function NavigationBar({ handleProfileMenuToggle, handleAppMenuToggle, handleNotificationsMenuToggle, sidebarOpen, setSidebarOpen }) {
    const { isAuthenticated } = useAuthDispatch();
    const { token } = useAuthState();
    const config = GetConfig(token);


    const privatePages = [
        { label: 'MechFlow', path: '/mechFlow' },
        { label: 'Stats', path: '/stats' },
    ];

    const publicPages = [
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' },
    ];



    const navItems = isAuthenticated ? privatePages : publicPages;

    const profileMenuRef = useRef(null);
    const appMenuRef = useRef(null);
    const notificationsMenuRef = useRef(null);


    return (
        <nav className="navigation-bar">
            <div className="navigation-bar-inner">
                {isAuthenticated &&
                    <div className='navigation-side-menubar' onClick={(e) => e.stopPropagation()}>
                        <SidebarMenuIcon sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                    </div>
                }
                <div className='navigation-bar-header'>
                    <h1>4Space</h1>
                    <div className='navigation-links'>
                        <div className='navigation-page-links'>
                            {navItems.map((item, index) => (
                                <div key={index}>
                                    <Link to={item.path}>{item.label}</Link>
                                </div>
                            ))}
                        </div>
                        <div className='navigaton-utils'>
                        {isAuthenticated &&
                                <div className='navigation-bar-notifications-menu' ref={notificationsMenuRef} onClick={(e) => e.stopPropagation()}>
                                    <button onClick={handleNotificationsMenuToggle}>
                                        <FontAwesomeIcon icon={faBell} />
                                    </button>
                                </div>
                            }
                            {isAuthenticated &&
                                <div className="navigation-bar-menubar-icon" ref={appMenuRef} onClick={(e) => e.stopPropagation()}>
                                    <button onClick={handleAppMenuToggle}>
                                        <NineDotIcon style={{ color: 'white', background: 'transparent', fontSize: '24px' }} />
                                    </button>
                                </div>
                            }
                            {isAuthenticated &&
                                <div className='navigation-bar-profile-menu' ref={profileMenuRef} onClick={(e) => e.stopPropagation()}>
                                    <button onClick={handleProfileMenuToggle}>
                                        <ProfilePicture />
                                    </button>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>        
        </nav>
    );
}

export default NavigationBar;
