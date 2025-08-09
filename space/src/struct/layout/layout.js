// Layout.js
import React, { useState, useEffect, useRef } from 'react';
import './layout.css';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../navbar/navbar';
import Sidebar from '../sidebar/Sidebar';
import useProfile from '../../hooks/useProfile';
import NotificationSidebar from '../sidebar/notificationSidebar/notificationSidebar';
import SmallSidebar from '../sidebar/smallSidebar/smallSidebar';
import { usePostContext } from '../../context/PostContext';
import Post from '../../apps/home/post/post';
import { useLocation } from 'react-router-dom';
import { useDevice } from '../../context/DeviceContext';

function Layout({ children }) {
    const { isAuthenticated } = useAuth();

    const { expandPostIdReciever } = usePostContext();

    const { minimalProfileData: profileData } = useProfile();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchSidebarOpen, setSearchSidebarOpen] = useState(false);
    const [notificationSidebarOpen, setNotificationSidebarOpen] = useState(false);
    const [notificationIdForSidebar, setNotificationIdForSidebar] = useState(null);



    // for small screen
    const [smallSidebarOpen, setSmallSidebarOpen] = useState(false);
    const { isM, isT, isD } = useDevice();

    const location = useLocation();

    const isFourChatStandalone = location.pathname === '/4chat';
    const isFourChatEmbedded = location.pathname === '/messages/4chat';
    const isFourChatAny = isFourChatStandalone || isFourChatEmbedded;

    const isHomePublic = !isAuthenticated && location.pathname === '/';
    const defaultShowNavbar = !isHomePublic;
    const showNavbar = isFourChatStandalone ? isAuthenticated : defaultShowNavbar;

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



    const handleCloseOverlays = () => {
        setSidebarOpen(false);
        setSearchSidebarOpen(false);
        setNotificationSidebarOpen(false);
    };


    if (isFullScreenRoute) {
        return (
            <div className="editor-isolated-layout">
                {children}
            </div>
        );
    }

    if (isD || isT) {
        return (
            <div className={`parent-layout`} onClick={() => handleCloseOverlays()}>
                {showNavbar && (
                    <div className='layout-navbar'>
                        <Navbar
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            profileData={profileData}
                            handleNotificationSidebarOpen={handleNotificationSidebarOpen}
                        />
                    </div>
                )}

                <div className={`layout-page ${showNavbar ? '' : 'no-nav'}`}>
                    {isAuthenticated && (
                        <div className='layout-small-sidebar'>
                            <SmallSidebar
                                searchSidebarOpen={searchSidebarOpen}
                                setSearchSidebarOpen={setSearchSidebarOpen}
                            />
                        </div>
                    )}
                    <div className={`layout-page-content ${isAuthenticated ? 'sidebar' : ''}`}>
                        {children}
                    </div>
                </div>
                {isAuthenticated && (
                    <Sidebar
                        isOpen={sidebarOpen}
                        onClose={handleSidebarClose}
                    />
                )}
                {isAuthenticated && (
                    <NotificationSidebar
                        notificationSidebarOpen={notificationSidebarOpen}
                        notificationIdForSidebar={notificationIdForSidebar}
                        setNotificationIdForSidebar={setNotificationIdForSidebar}
                        handleNotificationSidebarClose={handleNotificationSidebarClose}
                        handleNotificationSidebarOpen={handleNotificationSidebarOpen}
                    />
                )}
                {expandPostIdReciever && <Post />}
            </div>
        )
    }
    if (isM) {
        return (
            <div className={`parent-layout`} onClick={() => handleCloseOverlays()}>
                {showNavbar && (
                    <div className='layout-navbar'>
                        <Navbar
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            profileData={profileData}
                            handleNotificationSidebarOpen={handleNotificationSidebarOpen}
                        />
                    </div>
                )}

                <div className='layout-page'>
                    <div className={`layout-page-content ${isAuthenticated ? 'sidebar' : ''}`}>
                        {children}
                    </div>
                    {isAuthenticated && (
                        <div className='layout-small-sidebar'>
                            <SmallSidebar
                                searchSidebarOpen={searchSidebarOpen}
                                setSearchSidebarOpen={setSearchSidebarOpen}
                            />
                        </div>
                    )}
                </div>
                {isAuthenticated && (
                    <Sidebar
                        isOpen={sidebarOpen}
                        onClose={handleSidebarClose}
                    />
                )}
                {isAuthenticated && (
                    <NotificationSidebar
                        notificationSidebarOpen={notificationSidebarOpen}
                        notificationIdForSidebar={notificationIdForSidebar}
                        setNotificationIdForSidebar={setNotificationIdForSidebar}
                        handleNotificationSidebarClose={handleNotificationSidebarClose}
                        handleNotificationSidebarOpen={handleNotificationSidebarOpen}
                    />
                )}
                {expandPostIdReciever && <Post />}
            </div>
        )
    }
}

export default Layout;