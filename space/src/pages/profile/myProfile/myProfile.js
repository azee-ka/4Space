// File: src/pages/profile/myProfile/MyProfile.jsx

import { useEffect, useState } from "react";
import './myProfile.css';
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { FaCog } from "react-icons/fa";
import UserListOverlay from "../../../components/userListOverlay/userListOverlay";

// Tab Components
import MyPostsTab from "./tabs/myPostsTab/myPostsTab";
import MyCommunitiesTab from "./tabs/myCommunitiesTab/myCommunitiesTab";
import CollectionsPostsTab from "./tabs/bookmarkedPostsTab/collectionsTab";
import { formatDateTime } from "../../../utils/formatDateTime";

const MyProfile = ({ username: usernameProp, fetchProfileData, isCustomizing }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuth();
  const [profileInfo, setProfileInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showFollowersOverlay, setShowFollowersOverlay] = useState(false);
  const [showFollowingOverlay, setShowFollowingOverlay] = useState(false);

  // ─── Decide activeTab from URL ───
  // defaultTabs keys: 'posts', 'communities', 'collections'
  const defaultTabs = [
    { key: 'posts', label: 'My Posts' },
    { key: 'communities', label: 'My Communities' },
    { key: 'collections', label: 'My Collections' },
  ];

  // pull ?tab= from the query string
  const getTabFromSearch = () => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t === 'communities' || t === 'collections') return t;
    return 'posts';
  };

  const [activeTab, setActiveTab] = useState(getTabFromSearch());

  // Whenever location.search changes (e.g. user hit back/forward), update activeTab
  useEffect(() => {
    const newTab = getTabFromSearch();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // ─── Fetch profileInfo on mount / username change ───
  useEffect(() => {
    setIsLoading(true);
    const targetUsername = usernameProp || authState?.current?.user.username;
    fetchProfileData(targetUsername, (data) => {
      setProfileInfo(data);
      setIsLoading(false);
    });
    // eslint-disable-next-line
  }, [usernameProp]);

  if (isLoading) {
    return (
      <div className="profile-page loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  // ─── Helper: update URL to ?tab=<key> without reloading ───
  const switchToTab = (tabKey) => {
    // update the URL query string
    const params = new URLSearchParams(location.search);
    params.set('tab', tabKey);
    navigate({ search: params.toString() }, { replace: true });
    // activeTab will also update via the useEffect on location.search
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
        {/* ─── Left Sidebar ─── */}
        <aside className="profile-left">
          <div className="profile-card">
            <div className="profile-settings">
              <FaCog onClick={() => navigate('/settings#profile-basic-info')} />
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

        {/* ─── Center Panel ─── */}
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

      {/* ─── Overlays ─── */}
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
