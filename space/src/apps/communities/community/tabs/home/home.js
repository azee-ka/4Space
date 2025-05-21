import React, { useState } from 'react';
import './home.css';
import ProfilePicture from '../../../../../utils/profilePicture/getProfilePicture';
import { formatDateTime } from '../../../../../utils/formatDateTime';
import { FiSettings } from 'react-icons/fi';
import default_banner_image from '../../../../../assets/default_banner_image.png';

const HomeTab = ({ community }) => {

    const [metaTab, setMetaTab] = useState('overview');
    const metaTabs = ['overview', 'analytics', 'metrics'];

    return (
        <div className="community-home-tab">
            <div className="community-card community-overview-card fixed-half">
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

            <div className="community-card community-meta-card">
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
                        <button className="community-join-btn">
                            {community.is_member ? 'Leave' : 'Join'}
                        </button>
                        {['admin', 'owner'].includes(community.user_role) && (
                            <>
                                <button className="community-settings-btn" title="Settings">
                                    <FiSettings size={16} />
                                </button>
                            </>
                        )}
                        <button className="community-guidelines-btn">
                            Guidelines
                        </button>
                    </div>
                </div>

                {/* Meta Card Content */}
                {metaTab === 'overview' && (
                    <>
                        <div className="community-meta-top">
                            <div className="community-description-block">
                                <label className="meta-label">Description</label>
                                <p className="community-description">{community.description}</p>
                            </div>
                        </div>

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


            <div className="community-card community-quicklinks-card fixed-small">
                <h4>Quick Access</h4>
                <div className="quick-link-buttons">
                    <button>Button 1</button>
                    <button>Button 1</button>
                </div>
            </div>

            <div className="community-card community-pinned-card">
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