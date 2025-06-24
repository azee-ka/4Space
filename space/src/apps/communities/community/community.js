// src/pages/Community/CommunityPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CommunityProvider, useCommunity } from "../../../context/CommunityContext";
import { TAB_COMPONENTS_FLAT } from "./tabs/tabComponents";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import RenderText from "../../../utils/autoCompleteInput/renderText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEnvelopeOpen } from "@fortawesome/free-solid-svg-icons";
import AddTabOverlay from "./addTabOverlay/addTabOverlay";
import InviteOverlay from "./inviteOverlay/inviteOverlay";
import "./community.css";

export default function CommunityPage() {
  const { slug } = useParams();
  return (
    <CommunityProvider slug={slug}>
      <Community />
    </CommunityProvider>
  );
}

function Community() {
  const {
    community,
    selectedTab,
    setSelectedTab,
    fetchCommunityData,
    handleJoinLeave,
    addTabs,
  } = useCommunity();

  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  // fetch on mount
  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  // sync selectedTab to hash or default
  useEffect(() => {
    if (!community || !community.tabs?.length) return;
    const raw = window.location.hash.replace("#", "");
    const key = raw.split("-")[0];
    const found = community.tabs.find(t => t.key === key);
    setSelectedTab(found || community.tabs[0]);
  }, [community, setSelectedTab]);

  if (!community) {
    return <div className="loading">Loading…</div>;
  }

  return (
    <div className="community-page">
      {/* — App Bar */}
      <div className="cp-appbar">
        <div className="cp-info">
          <ProfilePicture
            src={community.logo}
            isCommunity
            className="cp-logo"
          />
          <div>
            <h1>{community.name}</h1>
            <div className="cp-subtitle">
              <RenderText text={`c/${community.slug}`} />{" "}
              <span className="cp-dot">·</span>{" "}
              {community.members_count} members
            </div>
          </div>
        </div>
        <div className="cp-actions">
          <button
            onClick={handleJoinLeave}
            className={`btn ${community.is_member ? "btn-leave" : "btn-join"}`}
          >
            {community?.is_member ? "Leave" : "Join"}
          </button>
          {community?.permissions?.can_invite_members && (
            <button
              onClick={() => setShowInvite(true)}
              className="btn btn-invite"
            >
              <FontAwesomeIcon icon={faEnvelopeOpen} /> Invite
            </button>
          )}
        </div>
      </div>

      {/* — Tab Bar */}
      <nav className="cp-tabs">
        <div className="cp-tabs-left">
          {community.tabs.map(tab => (
            <button
              key={tab.key}
              className={`cp-tab ${
                selectedTab?.key === tab.key ? "active" : ""
              }`}
              onClick={() => {
                setSelectedTab(tab);
                window.history.replaceState(null, "", `#${tab.key}`);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {community?.permissions?.can_add_tabs && (
          <button
            className="cp-btn cp-btn-add"
            onClick={() => setShowAdd(true)}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Tab
          </button>
        )}
      </nav>

      {/* — Content */}
      <main className="cp-content">
        {selectedTab && TAB_COMPONENTS_FLAT[selectedTab.key] ? (
          React.createElement(
            TAB_COMPONENTS_FLAT[selectedTab.key].Component,
            {
              communitySlug: community.slug,
              community,
              handleJoinLeave,
              setInviteOverlayOpen: () => setShowInvite(true),
              fetchCommunityData,
            }
          )
        ) : (
          <div className="placeholder">
            No content for “{selectedTab?.label || "…"}” yet.
          </div>
        )}
      </main>

      {/* — Overlays */}
      {showAdd && (
        <AddTabOverlay
          onClose={() => setShowAdd(false)}
          communitySlug={community.slug}
          community={community}
          addTabs={addTabs}
        />
      )}
      {showInvite && (
        <InviteOverlay
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}
