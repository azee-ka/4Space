import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './layout.css';
import GetConfig from '../../components/general/Authentication/utils/config';
import API_BASE_URL from '../../config';
import { useAuthState } from '../../components/general/Authentication/utils/AuthProvider';

import NavigationBar from '../../components/general/NavigationBar/NavigationBar';
import Sidebar from '../../components/sidebar/Sidebar';
import AppMenu from '../../components/general/appMenu/appMenu';
import Menubar from '../../components/general/menubar/menubar';
import UserListOverlay from '../../components/timeline/userListOverlay/userListOverlay';
import CreatePostOverlay from '../../components/timeline/post/createPost/createPostOverlay';
import ExpandPostOverlay from '../../components/timeline/post/expandedPost/expandPostOverlay/expandPostOverlay';
import Notifications from '../../components/general/notifications/notifications';
import usePersistentWebSocket from '../../utils/websocket/websocket';
import SmallSidebar from '../../components/sidebar/smallSidebar/smallSidebar';
const Layout = ({ children, userList, userListTitle, showUserList, setShowUserList, showExpandedPostOverlay, setShowExpandedPostOverlay, expandPostPreviousLocation, postId, prevPostId, nextPostId, setPostId, setPrevPostId, setNextPostId }) => {
    const { token, isAuthenticated, user } = useAuthState();
    const config = GetConfig(token);
    const location = useLocation();
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState({});

    const [menuOpen, setMenuOpen] = useState(false);
    const [appMenuOpen, setAppMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);

    const [showCreatePostOverlay, setShowCreatePostOverlay] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    
    const handleExpandPostOverlayClose = () => {
        setShowExpandedPostOverlay(false);
        navigate(`${expandPostPreviousLocation}`);
    };

    const handleSidebarClose = () => {
        setSidebarOpen(false);
    };


    const handleProfileMenuToggle = () => {
        setMenuOpen(!menuOpen);
        if (appMenuOpen || notificationsMenuOpen) {
            setAppMenuOpen(false);
            setNotificationsMenuOpen(false);
        }
    };

    const handleAppMenuToggle = () => {
        setAppMenuOpen(!appMenuOpen);
        if (menuOpen || notificationsMenuOpen) {
            setMenuOpen(false);
            setNotificationsMenuOpen(false);
        }
    };

    const handleNotificationsMenuToggle = () => {
        setNotificationsMenuOpen(!notificationsMenuOpen);
        if (menuOpen || appMenuOpen) {
            setMenuOpen(false);
            setAppMenuOpen(false);
        }
    };

    const fetchUserInfo = async () => {
        try {
            // console.log(config);
            const response = await axios.get(`${API_BASE_URL}api/user/get-user-info/`, config);
            setUserInfo(response.data);

            // console.log(response.data)
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserInfo();
        }
    }, [isAuthenticated]);

    const handleCloseOverlays = (event) => {
        setSidebarOpen(false);
        setMenuOpen(false);
        setAppMenuOpen(false);
        setNotificationsMenuOpen(false);
    };

    useEffect(() => {
        handleCloseOverlays();
    }, [location]);

    usePersistentWebSocket(
        isAuthenticated ? `ws://localhost:8000/ws/notifications/${user.id}/` : null,
        config,
        (data) => {
            setNotifications((prevNotifications) => {
                const isDuplicate = prevNotifications.some((notification) => notification.id === data.id);
                if (!isDuplicate) {
                    return [data, ...prevNotifications];
                }
                return prevNotifications;
            });
        }
    );

    return (
        <div className='layout-page' onClick={handleCloseOverlays}>
            <div className='layout-navbar'>
                <NavigationBar
                    handleProfileMenuToggle={handleProfileMenuToggle}
                    handleAppMenuToggle={handleAppMenuToggle}
                    handleNotificationsMenuToggle={handleNotificationsMenuToggle}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    notificationCount={notifications.length + notificationCount}
                />
            </div>
            <div className='layout-page-content'>
                <div className={`layout-small-sidebar ${sidebarOpen ? 'large-sidebar-open' : ''}`}>
                    <SmallSidebar setShowCreatePostOverlay={setShowCreatePostOverlay} />
                </div>
                {children}
            </div>

            {<Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} setShowCreatePostOverlay={setShowCreatePostOverlay} />}

            {menuOpen && <Menubar userInfo={userInfo} />}
            {appMenuOpen && <AppMenu />}
            {notificationsMenuOpen && <Notifications notifications={notifications} setNotificationCount={setNotificationCount} />}
            {showUserList && <UserListOverlay userList={userList} title={userListTitle} onClose={() => setShowUserList(false)} />}
            {showCreatePostOverlay && <CreatePostOverlay onClose={() => setShowCreatePostOverlay(false)} />}
            {showExpandedPostOverlay && <ExpandPostOverlay onClose={handleExpandPostOverlayClose} postId={postId} prevPostId={prevPostId} nextPostId={nextPostId} setPostId={setPostId} setPrevPostId={setPrevPostId} setNextPostId={setNextPostId} />}
        </div>
    );
};

export default Layout;