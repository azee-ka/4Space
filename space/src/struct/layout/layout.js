// Layout.js
import React, { useState, useEffect, useRef } from 'react';
import './layout.css';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../navbar/navbar';
import Sidebar from '../sidebar/Sidebar';
import NotificationsMenu from '../navbar/notificationsMenu/notificationsMenu';
import ProfileMenu from '../navbar/profileMenu/profileMenu';
import AppMenu from '../navbar/appMenu/appMenu';
import useProfile from '../../hooks/useProfile';
import NotificationSidebar from '../sidebar/notificationSidebar/notificationSidebar';
import SmallSidebar from '../sidebar/smallSidebar/smallSidebar';
import { usePostContext } from '../../context/PostContext';
import Post from '../../apps/home/post/post';
import { useLocation } from 'react-router-dom';
import DisplayMenu from '../navbar/displayMenu/displayMenu';

function Layout({ children }) {
    const { isAuthenticated } = useAuth();

    const { expandPostIdReciever } = usePostContext();

    const { minimalProfileData: profileData } = useProfile();

    const [menuOpen, setMenuOpen] = useState(false);
    const [appMenuOpen, setAppMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchSidebarOpen, setSearchSidebarOpen] = useState(false);
    const [notificationSidebarOpen, setNotificationSidebarOpen] = useState(false);
    const [notificationIdForSidebar, setNotificationIdForSidebar] = useState(null);
    const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
    const [displayMenuVisible, setDisplayMenuVisible] = useState(false);



    const location = useLocation();

    const fullScreenRoutes = [
        '/rich-editor',
        '/latex-editor',
        '/code-editor'
    ];

    const isFullScreenRoute = fullScreenRoutes.some(route =>
        location.pathname.includes(route)
    );
 



    const handleSidebarClose = () => {
        setSidebarOpen(false);
    };

    const handleNotificationSidebarOpen = (notificationId) => {
        handleCloseOverlays();
        setNotificationSidebarOpen(true);
        setNotificationIdForSidebar(notificationId);
    };
    const handleNotificationSidebarClose = () => {
        setNotificationSidebarOpen(false);
    };


    const handleProfileMenuToggle = () => {
        setMenuOpen(!menuOpen);
        if (appMenuOpen || notificationsMenuOpen || displayMenuVisible) {
            setAppMenuOpen(false);
            setNotificationsMenuOpen(false);
            setDisplayMenuVisible(false);
        }
    };
    const handleAppMenuToggle = () => {
        setAppMenuOpen(!appMenuOpen);
        if (menuOpen || notificationsMenuOpen || displayMenuVisible) {
            setMenuOpen(false);
            setNotificationsMenuOpen(false);
            setDisplayMenuVisible(false);
        }
    };
    const handleNotificationsMenuToggle = () => {
        setNotificationsMenuOpen(!notificationsMenuOpen);
        if (menuOpen || appMenuOpen || displayMenuVisible) {
            setMenuOpen(false);
            setAppMenuOpen(false);
            setDisplayMenuVisible(false);
        }
    };
    const handleDisplayMenuToggle = () => {
        setDisplayMenuVisible(!displayMenuVisible);
        if (menuOpen || appMenuOpen || notificationsMenuOpen) {
            setMenuOpen(false);
            setAppMenuOpen(false);
            setNotificationsMenuOpen(false);
        }
    };

    const handleCloseOverlays = () => {
        setSidebarOpen(false);
        setSearchSidebarOpen(false);
        setNotificationSidebarOpen(false);
        setMenuOpen(false);
        setAppMenuOpen(false);
        setNotificationsMenuOpen(false);
        setDisplayMenuVisible(false);
    };


    if (isFullScreenRoute) {
        return (
            <div className="editor-isolated-layout">
                {children}
            </div>
        );
    }

    return (
        <div className={`parent-layout`} onClick={() => handleCloseOverlays()}>
            <div className='layout-navbar'>
                <Navbar
                    handleProfileMenuToggle={handleProfileMenuToggle}
                    handleAppMenuToggle={handleAppMenuToggle}
                    handleNotificationsMenuToggle={handleNotificationsMenuToggle}
                    handleDisplayMenuToggle={handleDisplayMenuToggle}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    profileData={profileData}
                />
            </div>

            <div className='layout-page'>
                {isAuthenticated &&

                    <div className='layout-small-sidebar'>
                        <SmallSidebar
                            searchSidebarOpen={searchSidebarOpen}
                            setSearchSidebarOpen={setSearchSidebarOpen}
                        // setCreateSpaceOpen={setCreateSpaceOpen}
                        />
                    </div>
                }
                <div className={`layout-page-content ${isAuthenticated ? 'sidebar' : ''}`}>
                    {children}
                </div>
            </div>
            {isAuthenticated &&
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={handleSidebarClose}
                />
            }
            {isAuthenticated &&
                <NotificationSidebar
                    notificationSidebarOpen={notificationSidebarOpen}
                    notificationIdForSidebar={notificationIdForSidebar}
                    setNotificationIdForSidebar={setNotificationIdForSidebar}
                    handleNotificationSidebarClose={handleNotificationSidebarClose}
                    handleNotificationSidebarOpen={handleNotificationSidebarOpen}
                />
            }
            {menuOpen && <ProfileMenu profileData={profileData} onClose={handleCloseOverlays} />}
            {appMenuOpen && <AppMenu />}
            {notificationsMenuOpen &&
                <NotificationsMenu
                    handleNotificationSidebarOpen={handleNotificationSidebarOpen}
                />}
            {expandPostIdReciever && <Post />}
            {displayMenuVisible && <DisplayMenu onClose={() => setDisplayMenuVisible(false)} />}
        </div>
    );
}

export default Layout;
