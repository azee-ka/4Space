import React, { useEffect, useState } from 'react';
import './community.css';
import { useParams } from 'react-router-dom';

import { CommunityProvider, useCommunity } from '../../../context/CommunityContext';
import { TAB_COMPONENTS_FLAT } from './tabs/tabComponents';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import AddTabOverlay from './addTabOverlay/addTabOverlay';
import InviteOverlay from './inviteOverlay/inviteOverlay';

const CommunityPage = () => {
  const { communityId } = useParams();
  return (
    <CommunityProvider communityId={communityId}>
      <Community />
    </CommunityProvider>
  );
};

const Community = () => {
  const {
    community,
    setCommunity,
    selectedTab,
    setSelectedTab,
    fetchCommunityData,
    handleJoinLeave,
    addTabs
  } = useCommunity();

  const [addTabOverlayIsOpen, setAddTabOverlayIsOpen] = useState(false);
  const [inviteOverlayOpen, setInviteOverlayOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    fetchCommunityData();
  }, []);

  useEffect(() => {
    if (community?.tabs?.length > 0) {
      const rawHash = window.location.hash.replace('#', '');
      const tabPrefix = rawHash.split('-')[0];
      const matchingTab = community?.tabs?.find(tab => tab?.key === tabPrefix);
      setSelectedTab(matchingTab || community?.tabs[0]);
    }
  }, [community, setSelectedTab]);

  return community ? (
    <div className="community-wrapper">
      {/* Sidebar */}
      <div className="community-sidebar">
        {/* Header Card */}
        <div className={`community-card community-header-bar ${selectedTab?.key === 'home' ? 'hidden' : ''}`}>
          <div className="community-header-top">
            <ProfilePicture
              src={community?.logo}
              isCommunity={true}
              className="community-header-logo"
            />
            <div className="community-header-info">
              <div className="community-header-name">{community?.name}</div>
              <div className="community-header-meta">
                {community.members_count || 0} members • {community?.posts_count || 0} posts
              </div>
            </div>
          </div>
          <div className="community-header-actions">
            <button
              className={`community-join-btn ${community?.is_member ? 'leave' : ''}`}
              onClick={handleJoinLeave}
            >
              {community?.is_member ? 'Leave' : 'Join'}
            </button>
            {community?.visiblity === 'public' && community?.permissions?.can_invite_members && (
              <button
                className="community-invite-btn"
                onClick={() => setInviteOverlayOpen(true)}
              >
                Invite
              </button>
            )}
          </div>
        </div>

        {/* Tabs Card */}
        <div className={`community-card community-tabs-card ${selectedTab?.key === 'home' ? 'shift-up' : ''}`}>
          <div className="community-tabs-header">
            <h3 className="community-tabs-title">Menu</h3>
            {community?.permissions?.can_add_tabs && (
              <button
                className="community-add-tab-btn"
                onClick={() => setAddTabOverlayIsOpen(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Tab
              </button>
            )}
          </div>
          <div className="community-tabs-list">
            {community?.tabs?.map(tab => (
              <div
                key={tab.key}
                className={`community-tab-item ${selectedTab?.key === tab.key ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTab(tab);
                  window.history.replaceState(null, '', `#${tab.key}`);
                }}
              >
                {tab.label || 'Untitled'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='community-card-wrapper'>
        <div className="community-content-card">
          {selectedTab?.key && TAB_COMPONENTS_FLAT[selectedTab?.key] ? (
            React.createElement(TAB_COMPONENTS_FLAT[selectedTab?.key].Component, {
              communityId: community.id,
              tab: selectedTab,
              community,
              handleJoinLeave,
              setInviteOverlayOpen,
              fetchCommunityData,
            })
          ) : (
            <div className="tab-content-placeholder">This tab is not yet supported.</div>
          )}
        </div>
      </div>

      {/* Overlays */}
      {addTabOverlayIsOpen && (
        <AddTabOverlay
          onClose={() => setAddTabOverlayIsOpen(false)}
          communityId={community?.id}
          setCommunity={setCommunity}
          community={community}
          addTabs={addTabs} // inject from context for consistent updates
        />
      )}
      {inviteOverlayOpen && (
        <InviteOverlay communityId={community?.id} onClose={() => setInviteOverlayOpen(false)} />
      )}
    </div>
  ) : (
    <div className="community-loading">Loading...</div>
  );
};

export default CommunityPage;
