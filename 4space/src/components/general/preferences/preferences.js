import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './preferences.css';
import GetConfig from '../Authentication/utils/config';
import { useAuthState } from '../Authentication/utils/AuthProvider';
import API_BASE_URL from '../../../config';
import ToggleSwitch from '../../../utils/toggleSwitch/toggleSwitch';

const Preferences = () => {
    const { token } = useAuthState();
    const config = GetConfig(token);
    const [profileIsPrivate, setProfileIsPrivate] = useState(false);
    const [activeSetting, setActiveSetting] = useState(null);

     // Fetch the initial state of profile visibility
     const fetchProfileVisibility = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/user/profile-visibility-status/`, config);
            setProfileIsPrivate(response.data.is_private_profile);
        } catch (error) {
            console.error("Error fetching profile visibility", error);
        }
    };

    useEffect(() => {
        fetchProfileVisibility();
    }, []);

    const handleToggleProfileView = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}api/user/toggle-profile-visibility/`, null, config);
            console.log(response.data)
            setProfileIsPrivate(response.data.is_private_profile);
        } catch (error) {
            console.error("Error toggling profile visibility", error);
        }
    };

    const sidebarButtons = [
        { label: 'Profile Visibility', onClick: () => setActiveSetting('profileVisibility') },
        // Add more buttons here as needed
    ];

    return (
        <div className="preferences-page">
            <div className='preferences-header'>
                <div className='preferences-header-inner'>
                    <h2>Preferences</h2>
                </div>
            </div>
            <div className='preferences-page-content'>
                <div className='preferences-page-content-inner'>
                    <div className='preferences-sidebar'>
                        <div className='preferences-sidebar-inner'>
                        {sidebarButtons.map((button, index) => (
                            <button key={index} onClick={button.onClick}>
                                {button.label}
                            </button>
                        ))}
                        </div>
                    </div>
                    <div className='preferences-settings'>
                        <div className='preferences-settings-inner'>
                            {activeSetting === 'profileVisibility' && (
                                <div className='preferences-settings-block'>
                                    <div className='preferences-settings-header'>
                                        <h3>Profile Visibility</h3>
                                    </div>
                                    <div className='profile-visibility-toggle-container'>
                                        <div className='profile-visibility-btn-description'>
                                            <p>Toggle your profile private/public</p>
                                        </div>
                                        <div className='profile-visibility-btn-container'>
                                            <ToggleSwitch
                                                isOn={profileIsPrivate}
                                                handleToggle={handleToggleProfileView}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Add more settings here as needed */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Preferences;
