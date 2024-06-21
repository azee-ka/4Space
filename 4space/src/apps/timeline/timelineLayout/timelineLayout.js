import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './timelineLayout.css';
import GetConfig from '../../../general/components/Authentication/utils/config';
import API_BASE_URL from '../../../config';
import { useAuthState } from '../../../general/components/Authentication/utils/AuthProvider';

import NavigationBar from '../appComponents/NavigationBar/NavigationBar';
import Sidebar from '../appComponents/sidebar/Sidebar';
import AppMenu from '../../../general/components/appMenu/appMenu';
import Menubar from '../../../general/components/menubar/menubar';
import UserListOverlay from '../utils/userListOverlay/userListOverlay';
import CreatePostOverlay from '../pages/post/createPost/createPostOverlay';
import ExpandPostOverlay from '../pages/post/expandedPost/expandPostOverlay/expandPostOverlay';
import Notifications from '../appComponents/notifications/notifications';
import usePersistentWebSocket from '../../../general/utils/websocket/websocket';
import SmallSidebar from '../appComponents/sidebar/smallSidebar/smallSidebar';

const TimelineLayout = ({ children, userList, userListTitle, showUserList, setShowUserList, showExpandedPostOverlay, setShowExpandedPostOverlay, expandPostPreviousLocation, postId, prevPostId, nextPostId, setPostId, setPrevPostId, setNextPostId }) => {
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
                {isAuthenticated &&
                    <div className={`layout-small-sidebar ${sidebarOpen ? 'large-sidebar-open' : ''}`}>
                        <SmallSidebar setShowCreatePostOverlay={setShowCreatePostOverlay} />
                    </div>
                }
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

export default TimelineLayout;