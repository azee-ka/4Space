import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavigationBar.css';
import { useAuthDispatch, useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTh, faBell } from '@fortawesome/free-solid-svg-icons';
import ProfilePicture from '../../../../general/utils/profilePicture/getProfilePicture';
import NineDotIcon from '../../../../general/utils/icons/nine-dot';
import SidebarMenuIcon from '../../../../general/utils/icons/sidebar-menu-icon/sidebar-menu-icon';
import GetConfig from '../../../../general/components/Authentication/utils/config';

function NavigationBar({ handleProfileMenuToggle, handleAppMenuToggle, handleNotificationsMenuToggle, sidebarOpen, setSidebarOpen, notificationCount }) {
    const { isAuthenticated } = useAuthDispatch();

    const privatePages = [
        { label: 'TimeFlow', path: '/timeflow' },
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
                    <div className='navigation-bar-app-title'>
                        <h1>4Space</h1>
                        <p>TimeFlow</p>
                    </div>
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
                                    {notificationCount > 0 && (
                                        <span className="notification-count">
                                            {notificationCount > 9 ? '9+' : notificationCount}
                                        </span>
                                    )}
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
