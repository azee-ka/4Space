import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthDispatch } from '../Authentication/utils/AuthProvider';
import './menubar.css';
import ProfilePicture from '../../utils/profilePicture/getProfilePicture';

const Menubar = ({ userInfo }) => {
    const { isAuthenticated, logout } = useAuthDispatch();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const buttonsData = [
        { path: '/timeline/preferences', label: 'Preferences' },
        { path: '/servers', label: 'Servers' },
        { path: '/timeline/profile', label: 'Profile' }
    ];


    const handleLogout = () => {
        logout();
        setIsLoading(true);
        setTimeout(() => {
            navigate('/login');
            setIsLoading(false);
        }, 500);
    };

    console.log(userInfo)

    return (
        <div className='profile-menubar' onClick={(e) => e.stopPropagation()}>
            <div className='profile-menubar-inner'>
                <div className='profile-menu-user-info'>
                    <Link to={'/timeline/profile'}>
                        <div className='profile-menu-user-info-inner'>
                            <div className='profile-menu-profile-picture'>
                                <ProfilePicture />
                            </div>
                            <div className='profile-menu-user-demo'>
                                <div className='first-last-name'>
                                    <div>
                                        {userInfo.first_name}
                                    </div>
                                    <div>
                                        {userInfo.last_name}
                                    </div>
                                </div>
                                <div className='user-email-demo'>
                                    {userInfo.email}
                                </div>
                                {/* <p>{`${userInfo.first_name} ${userInfo.last_name}`}</p> */}

                            </div>
                        </div>
                    </Link>
                </div>
                <div className='profile-menu-btns'>
                    {buttonsData.map((button, index) => (
                        <div key={index}>
                            <Link to={button.path}>
                                {button.label}
                            </Link>
                        </div>
                    ))}
                </div>
                {isAuthenticated && (
                    <button className='sign-out-btn' onClick={handleLogout}>Sign Out</button>
                )}
            </div>
            {isLoading && <div className="loading-bar"></div>}

        </div>
    );
}

export default Menubar;