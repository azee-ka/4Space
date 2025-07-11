// src/components/profile/SocialProfile.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaCog, FaEdit } from "react-icons/fa";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import './socialProfile.css';
import MyPostsTab from "./tabs/myPostsTab/myPostsTab";
import MyCommunitiesTab from "./tabs/myCommunitiesTab/myCommunitiesTab";
import MyCollectionsTab from "./tabs/bookmarkedPostsTab/collectionsMyTab";
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import DropdownButton from '../../../../utils/popperButton/DropdownButton';
import UserListOverlay from "../../../../components/userListOverlay/userListOverlay";

const SocialProfile = ({ profileInfo }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showFollowersOverlay, setShowFollowersOverlay] = useState(false);
  const [showFollowingOverlay, setShowFollowingOverlay] = useState(false);

  const defaultTabs = [
    { key: 'posts', label: 'My Posts' },
    { key: 'communities', label: 'My Communities' },
    { key: 'collections', label: 'My Collections' },
  ];

  const getTabFromSearch = () => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t === 'communities' || t === 'collections') return t;
    return 'posts';
  };

  const [activeTab, setActiveTab] = useState(getTabFromSearch());

  useEffect(() => {
    const newTab = getTabFromSearch();
    if (newTab !== activeTab) setActiveTab(newTab);
    // eslint-disable-next-line
  }, [location.search]);

  const switchToTab = (tabKey) => {
  const params = new URLSearchParams(location.search);
  params.set('tab', tabKey);

  // Force view to always be 'social' here
  params.delete('view'); // Remove existing to control order
  const newSearch = new URLSearchParams();
  newSearch.set('view', 'social');  // Put view first
  for (const [key, value] of params.entries()) {
    newSearch.append(key, value);
  }

  navigate({ search: newSearch.toString() }, { replace: true });
};


  return (
    <>
      <div className="profile-main-panel">
        {/* Left Sidebar */}
        <aside className="profile-left">
          <div className="profile-card">
            <div className="profile-action-btns">
              <button onClick={() => navigate('/settings#profile-basic-info')} >
                <FaCog />
              </button>
              <DropdownButton
                toggleContent={<button><FaEdit /></button>}
              >
                <div className='profile-views-edit-menu'>
                  <Link
                    to="/settings#account-&-identity-profile-appearance"
                    className="hs-ext-link"
                    title="Go to profile view settings"
                    onClick={e => e.stopPropagation()}
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                  </Link>
                  <h3 className='profile-views-edit-menu-title'>
                    Profile View
                  </h3>
                  <div className='profile-views-edit-menu-list'>
                    <button>Edit Public View</button>
                    <button>Edit Private View</button>
                  </div>
                </div>
              </DropdownButton>
            </div>

            <div className="profile-profile-image">
              <ProfilePicture src={profileInfo?.basicInfo?.profile_image} />
            </div>
            <h2>@{profileInfo?.basicInfo?.username}</h2>
            {profileInfo?.basicInfo?.display_name && (
              <p className="display-name">
                {profileInfo.basicInfo.display_name}
              </p>
            )}
            <p className="bio">
              {profileInfo?.basicInfo?.about_me || "No bio provided."}
            </p>

            <div className="profile-stats">
              <div onClick={() => setShowFollowersOverlay(true)}>
                <strong>{profileInfo?.stats?.followers_count || 0}</strong>
                <span>Followers</span>
              </div>
              <div onClick={() => setShowFollowingOverlay(true)}>
                <strong>{profileInfo?.stats?.following_count || 0}</strong>
                <span>Following</span>
              </div>
              <div>
                <strong>{profileInfo?.stats?.spaces_count || 0}</strong>
                <span>Spaces</span>
              </div>
            </div>

            <Link
              to={`/profile/${profileInfo?.basicInfo?.username}`}
              className="edit-profile-button"
            >
              View Public Profile
            </Link>
          </div>
        </aside>

        {/* Center Panel */}
        <main className="profile-center">
          <section className="highlight-section">
            <h3>Highlights</h3>
            <div className="highlights-grid">
              {defaultTabs.map((tab) => (
                <div
                  key={tab.key}
                  className={`highlight-card ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => switchToTab(tab.key)}
                >
                  {tab.label}
                </div>
              ))}
            </div>
          </section>

          <section className="tab-section">
            {activeTab === 'posts' && <MyPostsTab />}
            {activeTab === 'communities' && <MyCommunitiesTab />}
            {activeTab === 'collections' && <MyCollectionsTab />}
          </section>
        </main>
      </div>

      {/* Overlays */}
      {showFollowersOverlay && (
        <UserListOverlay
          userList={profileInfo?.data?.followers}
          onClose={() => setShowFollowersOverlay(false)}
          title="Followers"
        />
      )}
      {showFollowingOverlay && (
        <UserListOverlay
          userList={profileInfo?.data?.following}
          onClose={() => setShowFollowingOverlay(false)}
          title="Following"
        />
      )}
    </>
  );
};

export default SocialProfile;
