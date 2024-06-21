import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './navbar.css';
import { useAuthDispatch } from '../../../../general/components/Authentication/utils/AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTh, faBell } from '@fortawesome/free-solid-svg-icons';
import ProfilePicture from '../../../../general/utils/profilePicture/getProfilePicture';
import NineDotIcon from '../../../../general/utils/icons/nine-dot';
import SidebarMenuIcon from '../../../../general/utils/icons/sidebar-menu-icon/sidebar-menu-icon';
import GetConfig from '../../../../general/components/Authentication/utils/config';

function PhotosNavigationBar({ handleProfileMenuToggle, handleAppMenuToggle, sidebarOpen, setSidebarOpen }) {
    const { isAuthenticated } = useAuthDispatch();

    const privatePages = [
        { label: 'Timeline', path: '/timeline' },
    ];

    const publicPages = [
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' },
    ];

    const navItems = isAuthenticated ? privatePages : publicPages;

    const profileMenuRef = useRef(null);
    const appMenuRef = useRef(null);


    return (
        <nav className="photos-navbar-bar">
            <div className="photos-navbar-bar-inner">
                {isAuthenticated &&
                    <div className='photos-navbar-side-menubar' onClick={(e) => e.stopPropagation()}>
                        <SidebarMenuIcon sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                    </div>
                }
                <div className='photos-navbar-bar-header'>
                    <div className='navbar-app-title'>
                        <h1>4Space</h1>
                        <p>Photos</p>
                    </div>
                    <div className='photos-navbar-links'>
                        <div className='photos-navbar-page-links'>
                            {navItems.map((item, index) => (
                                <div key={index}>
                                    <Link to={item.path}>{item.label}</Link>
                                </div>
                            ))}
                        </div>
                        <div className='photos-navbar-utils'>
                            {isAuthenticated &&
                                <div className="photos-navbar-bar-menubar-icon" ref={appMenuRef} onClick={(e) => e.stopPropagation()}>
                                    <button onClick={handleAppMenuToggle}>
                                        <NineDotIcon style={{ color: 'white', background: 'transparent', fontSize: '24px' }} />
                                    </button>
                                </div>
                            }
                            {isAuthenticated &&
                                <div className='photos-navbar-bar-profile-menu' ref={profileMenuRef} onClick={(e) => e.stopPropagation()}>
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

export default PhotosNavigationBar;
