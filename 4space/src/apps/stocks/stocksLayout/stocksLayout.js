import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './stocksLayout.css';
import GetConfig from '../../../general/components/Authentication/utils/config';
import API_BASE_URL from '../../../config';
import { useAuthState } from '../../../general/components/Authentication/utils/AuthProvider';

import Menubar from '../../../general/components/menubar/menubar';
import AppMenu from '../../../general/components/appMenu/appMenu';

import StocksNavbar from '../appComponents/navbar/navbar';
import StocksSidebar from '../appComponents/sidebar/sidebar';
import StocksSmallSidebar from '../appComponents/sidebar/smallSidebar/smallSidebar';

const StocksLayout = ({ children, showSidebar, showNavbar }) => {
    const { token, isAuthenticated, user } = useAuthState();
    const config = GetConfig(token);
    const location = useLocation();
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState([])

    const [menuOpen, setMenuOpen] = useState(false);
    const [appMenuOpen, setAppMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

    const handleCloseOverlays = (event) => {
        setSidebarOpen(false);
        setMenuOpen(false);
        setAppMenuOpen(false);
    };

    return (
        <div className='stocks-layout-page' onClick={handleCloseOverlays} >
            <div className='stocks-layout-navbar'>
                <StocksNavbar
                    handleProfileMenuToggle={handleProfileMenuToggle}
                    handleAppMenuToggle={handleAppMenuToggle}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
            </div>
            <div className='stocks-layout-page-content'>
                {isAuthenticated &&
                    <div className={`stocks-layout-small-sidebar ${sidebarOpen ? 'large-sidebar-open' : ''}`}>
                        <StocksSmallSidebar />
                    </div>
                }
                <div className='stocks-layout-page-content-inner'>
                    {children}
                </div>
            </div>
            {<StocksSidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />}
            {menuOpen && <Menubar userInfo={userInfo} />}
            {appMenuOpen && <AppMenu />}
        </div>
    );
};

export default StocksLayout;