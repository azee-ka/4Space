// src/pages/profile/fullProfile/FullProfile.jsx

import React, { useState, useEffect } from "react";
import './fullProfile.css';
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useApi from "../../../../utils/useApi";
import UserListOverlay from "../../../../components/userListOverlay/userListOverlay";
import { formatDateTime } from "../../../../utils/formatDateTime";
import { useAuth } from "../../../../hooks/useAuth";
import PostsTab from "../tabs/myPostsTab/postsTab";
import CommunitiesTab from "../tabs/communitiesTab/communitiesTab";
import CollectionsPostsTab from "../tabs/bookmarkedPostsTab/collectionsTab";

const FullProfile = ({ profileInfo, handleStartChat }) => {
  const { authState } = useAuth();
  const { callApi } = useApi();
  const navigate = useNavigate();
  const location = useLocation();

  // FOLLOW button state
  const [isFollowing, setIsFollowing] = useState(profileInfo?.interact?.is_following);

  // Overlay state
  const [showFollowersOverlay, setShowFollowersOverlay] = useState(false);
  const [showFollowingOverlay, setShowFollowingOverlay] = useState(false);

  // Tabs definition
  const defaultTabs = [
    { key: 'posts', label: 'Posts' },
    { key: 'communities', label: 'Communities' },
    { key: 'collections', label: 'Collections' },
  ];

  // Read tab from URL ?tab=…
  const getTabFromSearch = () => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    return defaultTabs.some(tab => tab.key === t) ? t : 'posts';
  };

  // Active tab state
  const [activeTab, setActiveTab] = useState(getTabFromSearch());

  // Keep isFollowing in sync if profileInfo changes
  useEffect(() => {
    setIsFollowing(profileInfo?.interact?.is_following);
  }, [profileInfo]);

  // Sync activeTab → URL
  const switchToTab = (tabKey) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', tabKey);
    navigate({ search: params.toString() }, { replace: true });
  };

  // Sync URL → activeTab
  useEffect(() => {
    const newTab = getTabFromSearch();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.search]);

  // Follow/Unfollow
  const handleFollowToggle = async () => {
    setIsFollowing(prev => !prev);
    try {
      await callApi(`profile/follow-toggle/${profileInfo?.basicInfo?.username}/`, 'POST');
      // optionally you can refresh data here
    } catch (err) {
      console.error('Follow toggle failed', err);
      setIsFollowing(prev => !prev);
    }
  };

  return (
    <div className={`profile-page ${authState?.current ? '' : 'no-auth'}`}>
      <div className="profile-top-panel">
        <h2>
          <Link to={`/profile/${profileInfo?.basicInfo?.username}`}>
            Profile @{profileInfo?.basicInfo?.username}
          </Link>
        </h2>
        <div className="profile-top-panel-date-joined">
          <p>Member since {formatDateTime(profileInfo?.basicInfo?.date_joined)}</p>
        </div>
      </div>

      <div className="profile-main-panel">
        <aside className="profile-left">
          <div className="profile-card">
            <div className="profile-profile-image">
              <ProfilePicture src={profileInfo?.basicInfo?.profile_image} />
            </div>
            {profileInfo?.basicInfo?.display_name && (
              <p className="display-name">{profileInfo.basicInfo.display_name}</p>
            )}
            <p className="bio">
              {profileInfo.basicInfo.about_me || "No bio provided."}
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
            </div>

            <div className="profile-actions">
              <button className="follow-button" onClick={handleFollowToggle}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              <button
                className="message-btn"
                onClick={() =>
                  handleStartChat([
                    {
                      username: profileInfo.basicInfo.username,
                      id: profileInfo.basicInfo.id
                    }
                  ])
                }
              >
                Message
              </button>
            </div>
          </div>
        </aside>

        <main className="profile-center">
          <section className="highlight-section">
            <h3>Highlights</h3>
            <div className="highlights-grid">
              {defaultTabs.map(tab => (
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
            {activeTab === 'posts' && <PostsTab />}
            {activeTab === 'communities' && <CommunitiesTab />}
            {activeTab === 'collections' && <CollectionsPostsTab />}
          </section>
        </main>
      </div>

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

export default FullProfile;
