import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './spectraLayout.css';
import GetConfig from '../../../general/components/Authentication/utils/config';
import API_BASE_URL from '../../../config';
import { useAuthState } from '../../../general/components/Authentication/utils/AuthProvider';

import Menubar from '../../../general/components/menubar/menubar';
import AppMenu from '../../../general/components/appMenu/appMenu';

import SpectraNavbar from '../appComponents/navbar/navbar';
import SpectraSidebar from '../appComponents/sidebar/sidebar';
import SpectraSmallSidebar from '../appComponents/sidebar/smallSidebar/smallSidebar';

const SpectraLayout = ({ children, showSidebar, showNavbar }) => {
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
        <div className='spectra-layout-page' onClick={handleCloseOverlays} >
            <div className='spectra-layout-navbar'>
                <SpectraNavbar
                    handleProfileMenuToggle={handleProfileMenuToggle}
                    handleAppMenuToggle={handleAppMenuToggle}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
            </div>
            <div className='spectra-layout-page-content'>
                {isAuthenticated &&
                    <div className={`spectra-layout-small-sidebar ${sidebarOpen ? 'large-sidebar-open' : ''}`}>
                        <SpectraSmallSidebar />
                    </div>
                }
                <div className='spectra-layout-page-content-inner'>
                    {children}
                </div>
            </div>
            {<SpectraSidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />}
            {menuOpen && <Menubar userInfo={userInfo} />}
            {appMenuOpen && <AppMenu />}
        </div>
    );
};

export default SpectraLayout;