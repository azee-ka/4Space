import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import './profileMenu.css';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { useNavigate } from 'react-router-dom';
import useTabSessionSync from '../../../hooks/useTabSessionSync';

const ProfileMenu = ({ profileData, onClose }) => {
    const { authState, logout, switchProfile } = useAuth();
    const navigate = useNavigate();
const { openProjectInNewTab } = useTabSessionSync();

    const currentUsername = authState.current?.user?.username;
    const otherAccounts = authState?.accounts?.filter(a => a.user.username !== currentUsername);

    const handleAddAccount = () => {
        localStorage.setItem('suppressAutoRedirect', 'true');
        window.open('/login?from=add-account', '_blank', 'noopener,noreferrer');
    };

    const handleManageAccount = () => {
        navigate('/settings');
        onClose?.();
    };

    const handleViewProfile = () => {
        navigate(`/profile/${profileData?.username}`);
        onClose?.();
    };

    return (
        <div className="profile-menu-container" onClick={(e) => e.stopPropagation()}>
            {/* Current Account */}
            <section>
                <div className="profile-section-header">Your Account</div>
                <div className="profile-menu-user-info profile-clickable" onClick={handleViewProfile}>
                    <div className="profile-avatar">
                        <ProfilePicture src={profileData?.profile_image} />
                    </div>
                    <div className="profile-text">
                        <p className="profile-name">{profileData?.first_name} {profileData?.last_name}</p>
                        <p className="profile-username">@{profileData?.username}</p>
                    </div>
                </div>
                <div className="profile-action-pills">
                    <button onClick={handleManageAccount}>Manage Account</button>
                    <button onClick={handleViewProfile}>Profile</button>
                </div>
            </section>

            {/* Other Accounts */}
            {otherAccounts.length > 0 && (
  <section className="profile-other-accounts">
    <div className="profile-section-subheader">Other Accounts</div>
    <div className="account-list">
      {otherAccounts.map(acc => (
        <div
          key={acc?.user?.username}
          className="account-item"
          onClick={() => 
            openProjectInNewTab('/', {
              user: acc.user,
              token: acc.token,
            })
          }
        >
          <div className="account-avatar">
            <ProfilePicture src={acc?.user?.profile_image} />
          </div>
          <div className="account-meta">
            <p className="account-name">{acc.user.first_name} {acc.user.last_name}</p>
            <p className="account-username">@{acc.user.username}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
)}


            {/* Add Account */}
            <section>
                <div className="profile-section-subheader">Add Account</div>
                <div className="profile-account-actions">
                    <button className="account-button" onClick={handleAddAccount}>
                        + Add Another Account
                    </button>
                </div>
            </section>

            {/* Sign Out */}
            <section className="profile-signout">
                <button onClick={logout}>Sign Out</button>
            </section>
        </div>
    );
};

export default ProfileMenu;
