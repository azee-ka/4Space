import React, { useEffect, useState } from 'react';
import './home.scss';
import ProfilePicture from '../../../../../utils/profilePicture/getProfilePicture';
import { formatDateTime } from '../../../../../utils/formatDateTime';
import { FiSettings } from 'react-icons/fi';
import default_banner_image from '../../../../../assets/default_banner_image.png';
import CommunitySettings from '../../settings/communitySettings';

const HomeTab = ({ community, handleJoinLeave, setInviteOverlayOpen, fetchCommunityData }) => {

    const [metaTab, setMetaTab] = useState('overview');
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState(null);

    useEffect(() => {
        if (window.location.hash.startsWith('#settings')) {
            setShowSettings(true);
            const [, tabParam] = window.location.hash.split('=');
            if (tabParam) {
                setSettingsTab(decodeURIComponent(tabParam));
            }
        }
    }, []);

    const openSettings = () => {
        setShowSettings(true);
        window.history.replaceState(null, '', '#settings');
    };

    const closeSettings = () => {
        setShowSettings(false);
        window.history.replaceState(null, '', ' ');
    };

    if (showSettings) {
        return (
            <CommunitySettings
                community={community}
                onBack={closeSettings}
                fetchCommunityData={fetchCommunityData}
                initialTab={settingsTab}
            />
        );
    }


    const metaTabs = ['overview', 'analytics', 'metrics'];

    return (
        <div className="community-home-tab">
            <div className="community-home-card community-overview-card fixed-half">
                <div className="community-banner-wrapper">
                    <img className="community-banner" src={community.banner || default_banner_image} alt="Banner" />
                    <div className="community-identity">
                        <div className="community-logo-circle">
                            <ProfilePicture src={community.logo} isCommunity={true} />
                        </div>
                        <h2 className="community-name">{community.name}</h2>
                    </div>
                </div>
            </div>

            <div className="community-home-card community-meta-card">
                {/* Meta Tabs Navigation */}
                <div className="community-meta-tabs">
                    {metaTabs.map(tab => (
                        <button
                            key={tab}
                            className={`meta-tab-btn ${metaTab === tab ? 'active' : ''}`}
                            onClick={() => setMetaTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}

                    <div className="community-meta-actions">
                        <button className={`community-join-btn ${community.is_member ? 'leave' : ''}`} onClick={handleJoinLeave}>
                            {community.is_member ? 'Leave' : 'Join'}
                        </button>
                        {community?.visiblity === "public" && community?.permissions?.can_invite_members &&
                            <button className="community-invite-btn" onClick={() => setInviteOverlayOpen(true)}>
                                Invite
                            </button>
                        }
                        {community?.permissions?.can_manage_settings && (
                            <button
                                className="community-settings-btn"
                                title="Settings"
                                onClick={openSettings}
                            >
                                <FiSettings size={16} />
                            </button>
                            )}

                        <button className="community-guidelines-btn">
                            Guidelines
                        </button>
                    </div>
                </div>

                {/* Meta Card Content */}
                {metaTab === 'overview' && (
                    <>
                    {community?.description !== '' &&
                        <div className="community-meta-top">
                            <div className="community-description-block">
                                <label className="meta-label">Description</label>
                                <p className="community-description">{community?.description}</p>
                            </div>
                        </div>
                    }
                        <div className="community-meta-grid">
                            <div className="meta-item"><label>Members</label>{community.members_count || 0}</div>
                            <div className="meta-item"><label>Online</label>{community.online_members_count || 0}</div>
                            <div className="meta-item"><label>Created</label>{formatDateTime(community.created_at)}</div>
                            <div className="meta-item"><label>Category</label>{community.category || 'General'}</div>
                        </div>
                    </>
                )}

                {metaTab === 'analytics' && (
                    <div className="meta-tab-content-placeholder">📊 Analytics coming soon...</div>
                )}

                {metaTab === 'metrics' && (
                    <div className="meta-tab-content-placeholder">📈 Community metrics will show here.</div>
                )}
            </div>


            <div className="community-home-card community-quicklinks-card fixed-small">
                <h4>Quick Access</h4>
                <div className="quick-link-buttons">
                    <button>Button 1</button>
                    <button>Button 1</button>
                </div>
            </div>
            <div className="community-home-card community-quicklinks-card fixed-small">
    <h4>Community Shortcuts</h4>
    <div className="quick-link-buttons">
        <button>📢 Announcements</button>
        <button>🎯 Join a Focus Group</button>
        <button>📄 Drafts</button>
    </div>
</div>

<div className="community-home-card community-quicklinks-card fixed-small">
    <h4>Engage More</h4>
    <div className="quick-link-buttons">
        <button>👑 Top Contributors</button>
        <button>🔥 Trending Posts</button>
    </div>
</div>

<div className="community-home-card community-quicklinks-card fixed-small">
    <h4>Community Tools</h4>
    <div className="quick-link-buttons">
        <button>🧭 Browse Tags</button>
        <button>💡 Suggest Feature</button>
    </div>
</div>

            <div className="community-home-card community-pinned-card">
                <h4>Pinned Announcements</h4>
                <ul className="pinned-list">
                    <li>🚀 Welcome to our new members!</li>
                    <li>📢 Don’t forget to check the Community Guidelines</li>
                </ul>
            </div>


        </div>
    )
}

export default HomeTab;