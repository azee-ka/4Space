import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CommunityProvider, useCommunity } from "../../../context/CommunityContext";
import { TAB_COMPONENTS_FLAT } from "./tabs/tabComponents";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import AddTabOverlay from "./addTabOverlay/addTabOverlay";
import InviteOverlay from "./inviteOverlay/inviteOverlay";
import "./community.css";
import RenderText from "../../../utils/autoCompleteInput/renderText";

const CommunityPage = () => {
  const { slug } = useParams();

  return (
    <CommunityProvider slug={slug}>
      <Community />
    </CommunityProvider>
  );
};

const Community = () => {
  const {
    community,
    selectedTab,
    setSelectedTab,
    fetchCommunityData,
    handleJoinLeave,
    addTabs,
  } = useCommunity();

  const [addTabOverlayIsOpen, setAddTabOverlayIsOpen] = useState(false);
  const [inviteOverlayOpen, setInviteOverlayOpen] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  useEffect(() => {
    if (community?.tabs?.length) {
      const raw = window.location.hash.replace("#", "");
      const key = raw.split("-")[0];
      const found = community.tabs.find((t) => t.key === key);
      setSelectedTab(found || community.tabs[0]);
    }
  }, [community, setSelectedTab]);

  if (!community) {
    return <div className="community-loading">Loading...</div>;
  }

  return (
    <div className="community-wrapper">
      {/* Sidebar */}
      <div className="community-sidebar">
        <div
          className={`community-card community-header-bar ${
            selectedTab?.key === "home" ? "hidden" : ""
          }`}
        >
          <div className="community-header-top">
            <ProfilePicture
              src={community.logo}
              isCommunity={true}
              className="community-header-logo"
            />
            <div className="community-header-info">
              <div className="community-header-name">
                <h2>{community.name}</h2>
                <h3><RenderText text={`c/${community?.slug}`} /></h3>
              </div>
              <div className="community-header-meta">
                {community.members_count || 0} members •{" "}
                {community.posts_count || 0} posts
              </div>
            </div>
          </div>
          <div className="community-header-actions">
            <button
              className={`community-join-btn ${
                community.is_member ? "leave" : ""
              }`}
              onClick={handleJoinLeave}
            >
              {community.is_member ? "Leave" : "Join"}
            </button>
            {community.visibility === "public" &&
              community.permissions.can_invite_members && (
                <button
                  className="community-invite-btn"
                  onClick={() => setInviteOverlayOpen(true)}
                >
                  Invite
                </button>
              )}
          </div>
        </div>

        <div
          className={`community-card community-tabs-card ${
            selectedTab?.key === "home" ? "shift-up" : ""
          }`}
        >
          <div className="community-tabs-header">
            <h3 className="community-tabs-title">Menu</h3>
            {community.permissions.can_add_tabs && (
              <button
                className="community-add-tab-btn"
                onClick={() => setAddTabOverlayIsOpen(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Tab
              </button>
            )}
          </div>
          <div className="community-tabs-list">
            {community.tabs.map((tab) => (
              <div
                key={tab.key}
                className={`community-tab-item ${
                  selectedTab?.key === tab.key ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedTab(tab);
                  window.history.replaceState(
                    null,
                    "",
                    `#${tab.key}`
                  );
                }}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="community-card-wrapper">
        <div className="community-content-card">
          {selectedTab?.key &&
          TAB_COMPONENTS_FLAT[selectedTab.key] ? (
            React.createElement(
              TAB_COMPONENTS_FLAT[selectedTab.key].Component,
              {
                communitySlug: community.slug,
                community,
                handleJoinLeave,
                setInviteOverlayOpen,
                fetchCommunityData,
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
        <AddTabOverlay
          onClose={() => setAddTabOverlayIsOpen(false)}
          communitySlug={community.slug}
          community={community}
          addTabs={addTabs}
        />
      )}
      {inviteOverlayOpen && (
        <InviteOverlay
          communitySlug={community.slug}
          onClose={() => setInviteOverlayOpen(false)}
        />
      )}
    </div>
  );
};


export default CommunityPage;