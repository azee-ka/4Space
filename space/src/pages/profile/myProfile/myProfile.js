// src/pages/profile/myProfile/MyProfile.jsx
import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from "../../../services/profile";
import { PROFILE } from '../../../services/queryKeys';
import { useAuth } from "../../../hooks/useAuth";
import './myProfile.css';
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaCog, FaEdit } from "react-icons/fa";
import UserListOverlay from "../../../components/userListOverlay/userListOverlay";
import MyPostsTab from "./tabs/myPostsTab/myPostsTab";
import MyCommunitiesTab from "./tabs/myCommunitiesTab/myCommunitiesTab";
import CollectionsPostsTab from "./tabs/bookmarkedPostsTab/collectionsTab";
import { formatDateTime } from "../../../utils/formatDateTime";
import React, { useState } from "react";
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

const MyProfile = ({ username: usernameProp, isCustomizing }) => {
  const { authState } = useAuth();
  const username = usernameProp || authState?.current?.user.username;
  const location = useLocation();
  const navigate = useNavigate();

  // Query the profile data
  const { data: profileInfo, isLoading } = useQuery({
    queryKey: PROFILE(username),
    queryFn: () => fetchProfile(username),
    enabled: !!username,
  });

  const [showFollowersOverlay, setShowFollowersOverlay] = useState(false);
  const [showFollowingOverlay, setShowFollowingOverlay] = useState(false);

  // Tabs
  const defaultTabs = [
    { key: 'posts', label: 'My Posts' },
    { key: 'communities', label: 'My Communities' },
    { key: 'collections', label: 'My Collections' },
  ];

  // Manage active tab via URL
  const getTabFromSearch = () => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t === 'communities' || t === 'collections') return t;
    return 'posts';
  };
  const [activeTab, setActiveTab] = useState(getTabFromSearch());

  // Update tab when URL changes
  React.useEffect(() => {
    const newTab = getTabFromSearch();
    if (newTab !== activeTab) setActiveTab(newTab);
    // eslint-disable-next-line
  }, [location.search]);

  if (isLoading) {
    return (
      <div className="profile-page loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  const switchToTab = (tabKey) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', tabKey);
    navigate({ search: params.toString() }, { replace: true });
  };

  return (
    <div className="profile-page">
      <div className="profile-top-panel">
        <h2>
          <Link to={'/profile'}>
            My Profile
          </Link>
        </h2>
        <div className="profile-top-panel-date-joined">
          <p>
            Member since {formatDateTime(profileInfo?.basicInfo?.date_joined)}
          </p>
        </div>
      </div>

      <div className="profile-main-panel">
        {/* Left Sidebar */}
        <aside className="profile-left">
          <div className="profile-card">
            <div className="profile-action-btns">
              <button onClick={() => navigate('/settings#profile-basic-info')} >
                <FaCog />
              </button> 
                <DropdownButton
                  toggleContent={
                    <button>
                      <FaEdit />
                    </button>
                  }
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
                    <button>
                      Edit Public View
                    </button>
                    <button>
                      Edit Private View
                    </button>
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
                  className={`highlight-card ${
                    activeTab === tab.key ? 'active' : ''
                  }`}
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
            {activeTab === 'collections' && <CollectionsPostsTab />}
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
    </div>
  );
};
export default MyProfile;
