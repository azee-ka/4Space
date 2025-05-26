// ProfileMenu.js
import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import './profileMenu.css';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { useNavigate } from 'react-router-dom';

const ProfileMenu = ({ profileData, onClose }) => {
    const { authState, logout, switchProfile } = useAuth();
    const navigate = useNavigate();

    const currentUsername = authState.current?.user?.username;
    const otherAccounts = authState?.accounts?.filter(a => a.user.username !== currentUsername);

const handleAddAccount = () => {
  localStorage.setItem('suppressAutoRedirect', 'true');
  const win = window.open('/login?from=add-account', '_blank', 'noopener,noreferrer');
};



    return (
        <div className="profile-menu-container" onClick={(e) => e.stopPropagation()}>
            {/* CURRENT ACCOUNT */}
            <div className="profile-section-header">Signed In</div>
            <div className="profile-menu-user-info">
                <div className="profile-avatar">
                    <ProfilePicture src={profileData?.profile_image} />
                </div>
                <div className="profile-text">
                    <p className="profile-name">{profileData?.first_name} {profileData?.last_name}</p>
                    <p className="profile-username">@{profileData?.username}</p>
                </div>
            </div>

            {/* SWITCH ACCOUNTS */}
            {otherAccounts.length > 0 && (
                <div className="account-list">
                    {otherAccounts.map(acc => (
                        <div
                            key={acc?.user?.username}
                            className="account-item"
                            onClick={() => switchProfile(acc)}
                        >
                            <div className="account-avatar">
                                <ProfilePicture src={acc?.user?.profile_image} />
                            </div>
                            <div className="account-meta">
                                <p className="account-name">{acc?.first_name} {acc?.last_name}</p>
                                <p className="account-username">@{acc?.username}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD ACCOUNT */}
            <div className="profile-section-header">Add Account</div>
            <div className="profile-account-actions">
                <button className="account-button" onClick={handleAddAccount}>
                    + Add Another Account
                </button>
            </div>

            {/* SIGN OUT */}
            <div className="profile-signout">
                <button onClick={logout}>Sign Out</button>
            </div>
        </div>
    );
};

export default ProfileMenu;
