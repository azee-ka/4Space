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

  const normalizeTab = (tab) => {
    if (!tab) return null;

    if (typeof tab.tab_definition === 'string') {
      return {
        ...tab,
        tab_definition: { key: tab.tab_definition, label: tab.tab_definition },
      };
    }

    return tab;
  };

  const getTabKey = (tab) => {
    return tab?.tab_definition?.key || null;
  };

  const getTabDisplayName = (tab) => {
    if (!tab) return 'Untitled';
    if (tab.custom_label?.trim()) return tab.custom_label;
    return tab.tab_definition?.label || tab.tab_definition?.key || 'Untitled';
  };


  const fetchCommunityData = async () => {
    try {
      const response = await callApi(`community/c/${communityId}/`);
      console.log('Community data retrieved successfully:', response.data);

      const normalizedTabs = (response.data.tabs || [])
        .map(normalizeTab)
        .filter(t => getTabKey(t)); // discard if no valid key

      const firstTab = normalizedTabs.length ? normalizedTabs[0] : null;

      setCommunity({
        ...response.data,
        tabs: normalizedTabs,
      });

      setSelectedTab(firstTab);
    } catch (error) {
      console.error('Error retrieving community data:', error);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [communityId]);




  useEffect(() => {
    if (!community) return;

    const existingKeys = community.tabs.map(getTabKey);
    if (!existingKeys.includes('home')) {
      const homeTab = {
        id: '__home__',
        tab_definition: { key: 'home', label: 'Home' },
        custom_label: 'Home',
      };

      setCommunity(prev => ({
        ...prev,
        tabs: [homeTab, ...prev.tabs],
      }));

      setSelectedTab(homeTab);
    }
  }, [community]);




  if (!community) {
    return <div className="community-loading">Loading...</div>;
  }

  return (
    <div className="community-wrapper">
      {getTabKey(selectedTab) !== 'home' && (
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

          {community.tabs.map(tab => (
            <div
              key={tab.id}
              className={`tab-item ${selectedTab?.id === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab)}
            >
              {getTabDisplayName(tab)}
            </div>
          ))}

        </div>

        <div className="community-card community-content-card">
          {getTabKey(selectedTab) &&
            TAB_COMPONENTS_FLAT[getTabKey(selectedTab)] ? (
            React.createElement(
              TAB_COMPONENTS_FLAT[getTabKey(selectedTab)].Component,
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
        <AddTabOverlay onClose={() => setAddTabOverlayIsOpen(false)} />
      )}
    </div>
  );
};

export default Community;
