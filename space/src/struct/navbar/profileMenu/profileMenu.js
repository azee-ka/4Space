// ProfileMenu.js
import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import './profileMenu.css';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import useApi from '../../../utils/useApi';

const ProfileMenu = ({ profileData, onClose }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const profileMenuLinks = [
        { label: 'Profile', path: '/profile', type: 'link' },
        { label: 'Settings', path: '/settings', type: 'link' },
        { label: 'Messages', path: '/messages/inbox', type: 'link' },
    ];

    const handleClick = (item) => {
        console.log('item', item)
        if (item.type === 'button') {
            if (typeof item.onClick === 'function') {
                item.onClick();
            }
        } else if (item.type === 'link') {
            navigate(item.path);
        } else if (item.type === 'context') {
            navigate(item.path);
        }
        onClose();
    };

    return (
        <div className="profile-menu-container" onClick={(e) => e.stopPropagation()}>
            <div className='profile-menu-user-info-container'>
                <div className='profile-menu-profile-picture-container'>
                    <div className='learner-profile-menu-user-profile-picture'>
                        <ProfilePicture src={profileData?.profile_image} />
                    </div>
                    <div className='learner-profile-menu-user-info-text'>
                        <div className='learner-profile-menu-name-text'>{profileData?.first_name} {profileData?.last_name}</div>
                        <div className='learner-profile-menu-username-text'>@{profileData?.username}</div>
                    </div>
                </div>
            </div>
            <div className="profile-menu-links">
                <ul>
                    {profileMenuLinks.map((item, index) => (
                        <li onClick={() => handleClick(item)} id='exclude-link' key={`${item.label}-${index}`}>
                            <div className='profile-menu-per-link'>
                                <div className='profile-menu-link-label'>
                                    {item.label}
                                </div>
                                {item.icon && <span className="link-icon">{item.icon}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className='profile-menu-sign-out-button-container'>
                <button onClick={logout}>Sign Out</button>
            </div>
        </div>
    );
};

// ProfileMenu.propTypes = {
//     user: PropTypes.object.isRequired,
//     logout: PropTypes.func.isRequired,
// };

export default ProfileMenu;
