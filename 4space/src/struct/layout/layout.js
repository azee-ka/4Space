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

const Layout = ({ children, userList, userListTitle, showUserList, setShowUserList, showExpandedPostOverlay, setShowExpandedPostOverlay, expandPostPreviousLocation, postId, prevPostId, nextPostId, setPostId, setPrevPostId, setNextPostId }) => {
    const { token, isAuthenticated } = useAuthState();
    const config = GetConfig(token);
    const location = useLocation();
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState({});

    const [menuOpen, setMenuOpen] = useState(false);
    const [appMenuOpen, setAppMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [showCreatePostOverlay, setShowCreatePostOverlay] = useState(false);

    const handleExpandPostOverlayClose = () => {
        setShowExpandedPostOverlay(false);
        navigate(`${expandPostPreviousLocation}`);
    };

    const handleSidebarClose = () => {
        setSidebarOpen(false);
    };


    const handleProfileMenuToggle = () => {
        setMenuOpen(!menuOpen);
        if (appMenuOpen) {
            setAppMenuOpen(false);
        }
    };

    const handleAppMenuToggle = () => {
        setAppMenuOpen(!appMenuOpen);
        if (menuOpen) {
            setMenuOpen(false);
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
    };

    useEffect(() => {
        handleCloseOverlays();
    }, [location])

    return (
        <div className='layout-page' onClick={handleCloseOverlays}>
            <div className='layout-navbar'>
                <NavigationBar
                    handleProfileMenuToggle={handleProfileMenuToggle}
                    handleAppMenuToggle={handleAppMenuToggle}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen} />
            </div>
            <div className='layout-page-content'>
                {children}
            </div>

            {<Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} setShowCreatePostOverlay={setShowCreatePostOverlay} />}

            {menuOpen && <Menubar userInfo={userInfo} />}
            {appMenuOpen && <AppMenu />}
            {showUserList && <UserListOverlay userList={userList} title={userListTitle} onClose={() => setShowUserList(false)} />}
            {showCreatePostOverlay && <CreatePostOverlay onClose={() => setShowCreatePostOverlay(false)} />}
            {showExpandedPostOverlay && <ExpandPostOverlay onClose={handleExpandPostOverlayClose} postId={postId} prevPostId={prevPostId} nextPostId={nextPostId} setPostId={setPostId} setPrevPostId={setPrevPostId} setNextPostId={setNextPostId}  />}
        </div>
    );
};

export default Layout;