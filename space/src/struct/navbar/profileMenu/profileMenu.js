import React from 'react';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import './profileMenu.css';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import useTabSessionSync from '../../../hooks/useTabSessionSync';


const ProfileMenuContent = ({
  profileData,
  onViewProfile,
  onManageAccount,
  onAddAccount,
  onLogout,
  otherAccounts,
  onAccountSwitch
}) => (
  <>
    <section>
      <div className="profile-section-header">Your Account</div>
      <div className="profile-menu-user-info profile-clickable" onClick={onViewProfile}>
        <div className="profile-avatar">
          <ProfilePicture src={profileData?.profile_image} />
        </div>
        <div className="profile-text">
          <p className="profile-name">{profileData?.first_name} {profileData?.last_name}</p>
          <p className="profile-username">@{profileData?.username}</p>
        </div>
      </div>
      <div className="profile-action-pills">
        <button onClick={onManageAccount}>Manage Account</button>
        <button onClick={onViewProfile}>Profile</button>
      </div>
    </section>
    {otherAccounts?.length > 0 && (
      <section className="profile-other-accounts">
        <div className="profile-section-subheader">Other Accounts</div>
        <div className="account-list">
          {otherAccounts.map(acc => (
            <div
              key={acc?.user?.username}
              className="account-item"
              onClick={() => onAccountSwitch(acc)}
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
    <section>
      <div className="profile-section-subheader">Add Account</div>
      <div className="profile-account-actions">
        <button className="account-button" onClick={onAddAccount}>
          + Add Another Account
        </button>
      </div>
    </section>
    <section className="profile-signout">
      <button onClick={onLogout}>Sign Out</button>
    </section>
  </>
);


const ProfileMenu = ({
  closeDropdown,
  profileData,
  toggleContent, // <-- This is the avatar/button/whatever trigger
  placement = 'bottom-end',
  boundaryRef,
}) => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const { openProjectInNewTab } = useTabSessionSync();

  const currentUsername = authState.current?.user?.username;
  const otherAccounts = authState?.accounts?.filter(a => a.user.username !== currentUsername) || [];

  // Handlers
  const handleAddAccount = () => {
    localStorage.setItem('suppressAutoRedirect', 'true');
    window.open('/login?from=add-account', '_blank', 'noopener,noreferrer');
  };

  const handleManageAccount = () => navigate('/settings');
  const handleViewProfile = () => navigate(`/profile/${profileData?.username}`);
  const handleAccountSwitch = (acc) => openProjectInNewTab('/', { user: acc.user, token: acc.token });
  const handleLogout = () => logout();

  return (
    <DropdownButton
      toggleContent={toggleContent}
      placement={placement}
      boundaryRef={boundaryRef}
    >
      <div className="profile-menu-container">
        <ProfileMenuContent
          profileData={profileData}
          onViewProfile={handleViewProfile}
          onManageAccount={handleManageAccount}
          onAddAccount={handleAddAccount}
          onLogout={handleLogout}
          otherAccounts={otherAccounts}
          onAccountSwitch={handleAccountSwitch}
        />
      </div>
    </DropdownButton>
  );
};

export default ProfileMenu;