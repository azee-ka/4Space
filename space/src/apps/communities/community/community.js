import React, { useEffect, useState } from 'react';
import './community.css';
import useApi from '../../../utils/useApi';
import { useParams } from 'react-router-dom';

import { TAB_COMPONENTS_FLAT } from './tabs/tabComponents';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import AddTabOverlay from './addTabOverlay/addTabOverlay';

const Community = () => {
  const { communityId } = useParams();
  const { callApi } = useApi();
  const [community, setCommunity] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);
  const [addTabOverlayIsOpen, setAddTabOverlayIsOpen] = useState(false);


  const fetchCommunityData = async () => {
    try {
      const response = await callApi(`community/c/${communityId}/`);
      console.log('Community data retrieved successfully:', response.data);
      setCommunity(response.data);
      setSelectedTab(response.data?.tabs[0]);
    } catch (error) {
      console.error('Error retrieving community data:', error);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [communityId]);


  useEffect(() => {
  if (community && community.tabs.length > 0 && !selectedTab) {
    setSelectedTab(community.tabs[0]);
  }
}, [community]);


  if (!community) {
    return <div className="community-loading">Loading...</div>;
  }

  console.log(community.tabs)

  return (
    <div className="community-wrapper">
      {selectedTab.key !== 'home' && (
        <div className="community-card community-header-bar">
          <div className="community-header-left">
            <ProfilePicture src={community.logo} isCommunity={true} className="community-header-logo" />
            <div className="community-header-text">
              <div className="community-header-name">{community.name}</div>
              <div className="community-header-meta">
                {community.members_count || 0} members • {community.posts_count || 0} posts
              </div>
            </div>
          </div>
          <div className="community-header-actions">
            <button className="community-join-btn">
              {community.is_member ? 'Leave' : 'Join'}
            </button>
            <button className="community-guidelines-btn">Guidelines</button>
          </div>
        </div>
      )}

      <div className="community-bottom-row">
        <div className="community-card community-tabs-card">
          <div className="community-tabs-header">
            <h3 className="community-tabs-title">Tabs</h3>
            {community?.permissions?.can_add_tabs && (
              <button
                className="community-add-tab-btn"
                onClick={() => setAddTabOverlayIsOpen(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Tab
              </button>
            )}
          </div>

          {community?.tabs?.map(tab => (
            <div
              key={tab.key}
              className={`tab-item ${selectedTab?.key === tab.key ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab.label || "Untitled"}
            </div>
          ))}

        </div>

        <div className="community-card community-content-card">
          {selectedTab.key &&
            TAB_COMPONENTS_FLAT[selectedTab.key] ? (
            React.createElement(
              TAB_COMPONENTS_FLAT[selectedTab.key].Component,
              {
                communityId: community.id,
                tab: selectedTab,
                community,
              }
            )
          ) : (
            <div className="tab-content-placeholder">
              This tab is not yet supported.
            </div>
          )}

        </div>
      </div>

      {addTabOverlayIsOpen && (
        <AddTabOverlay onClose={() => setAddTabOverlayIsOpen(false)} communityId={communityId} />
      )}
    </div>
  );
};

export default Community;
