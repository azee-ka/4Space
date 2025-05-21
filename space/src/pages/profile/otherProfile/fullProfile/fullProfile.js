import React, { useState, useEffect } from "react";
import './fullProfile.css';
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import { Link, useNavigate } from "react-router-dom";
import useApi from "../../../../utils/useApi";
import UserListOverlay from "../../../../components/userListOverlay/userListOverlay";

// Tabs (same as your MyProfile)
import MyPostsTab from "../../myProfile/tabs/myPostsTab/myPostsTab";
import MyCommunitiesTab from "../../myProfile/tabs/myCommunitiesTab/myCommunitiesTab";
import CollectionsPostsTab from "../../myProfile/tabs/bookmarkedPostsTab/collectionsTab";
import { formatDateTime } from "../../../../utils/formatDateTime";

const FullProfile = ({ profileInfo, handleStartChat }) => {
    const { callApi } = useApi();
    const navigate = useNavigate();

    const [isFollowing, setIsFollowing] = useState(profileInfo?.interact?.is_following);
    const [activeTab, setActiveTab] = useState('posts');

    const [showFollowersOverlay, setShowFollowersOverlay] = useState(false);
    const [showFollowingOverlay, setShowFollowingOverlay] = useState(false);

    const defaultTabs = [
        { key: 'posts', label: 'Posts' },
        { key: 'communities', label: 'Communities' },
        { key: 'collections', label: 'Collections' },
    ];

    useEffect(() => {
        setIsFollowing(profileInfo?.interact?.is_following);
    }, [profileInfo]);

    const handleFollowToggle = async () => {
        try {
            setIsFollowing(prev => !prev);
            await callApi(`profile/follow-toggle/${profileInfo?.basicInfo?.username}/`, 'POST');
            navigate(`/profile/${profileInfo?.basicInfo?.username}`, { state: { refreshed: true } });
        } catch (err) {
            console.error('Follow toggle failed', err);
            setIsFollowing(prev => !prev);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-top-panel">
                <h2>
                    <Link to={`/profile/${profileInfo?.basicInfo?.username}`}>
                        Profile @{profileInfo?.basicInfo?.username}
                    </Link>
                </h2>
                <div className="profile-top-panel-date-joined">
                    <p>Memeber since {formatDateTime(profileInfo?.basicInfo?.date_joined)}</p>
                </div>
            </div>

            <div className="profile-main-panel">
                <aside className="profile-left">
                    <div className="profile-card">
                        <div className="profile-profile-image">
                            <ProfilePicture src={profileInfo?.basicInfo?.profile_image} />
                        </div>
                        {profileInfo?.basicInfo?.display_name && (
                            <p className="display-name">{profileInfo?.basicInfo?.display_name}</p>
                        )}
                        <p className="bio">{profileInfo?.basicInfo?.about_me || "No bio provided."}</p>

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
                            <button className="follow-button" onClick={() =>  handleFollowToggle}>
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                            <button className="message-btn" onClick={() =>  handleStartChat(
                            [
                                { username: profileInfo?.basicInfo?.username, id: profileInfo?.basicInfo?.id},
                            ]
                                )}>
                            Message
                        </button>
                        </div>
                    </div>
                </aside>

                <main className="profile-center">
                    <section className="highlight-section">
                        <h3>Highlights</h3>
                        <div className="highlights-grid">
                            {defaultTabs.map((tab) => (
                                <div
                                    key={tab.key}
                                    className={`highlight-card ${activeTab === tab.key ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.key)}
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
