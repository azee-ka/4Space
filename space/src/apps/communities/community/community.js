import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CommunityProvider, useCommunity } from "../../../context/CommunityContext";
import { TAB_COMPONENTS_FLAT } from "./tabs/tabComponents";
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
import RenderText from "../../../utils/autoCompleteInput/renderText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEnvelopeOpen, faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
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
    exchange,
  } = useCommunity();

  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (!community?.tabs?.length) return;
    const raw = window.location.hash.replace("#", "");
    const key = raw.split("-")[0];
    const found = community.tabs.find(t => t.key === key);
    setSelectedTab(found || community.tabs[0]);
  }, [community?.tabs]);

  if (!community) return <div className="loading">Loading…</div>;

  const posts = exchange.posts || [];
  const isExchange =
    selectedTab?.key === "exchange" &&
    /^#exchange-[\w-]+$/.test(window.location.hash);


  return (
    <div className="community-page">
      <div className="community-body">

        {/* Left Sidebar */}
        {isExchange && (
          <aside className="community-sidebar-left">
            <h3>Recent Exchanges</h3>
            <ul className="sidebar-exchange-list">
              {posts.map(post => (
                <li key={post.id} className="exchange-item">
                  <button onClick={() => window.location.hash = `#exchange-${post.id}`}>
                    <div className="exchange-votes">
                      <FontAwesomeIcon icon={faArrowUp} />
                      <span>{post.upvotes}</span>
                      <FontAwesomeIcon icon={faArrowDown} />
                    </div>
                    <div className="exchange-info">
                      <div className="exchange-title">
                        {post.title.length > 40
                          ? post.title.slice(0, 40) + "…"
                          : post.title}
                      </div>
                      <div className="exchange-meta">
                        <span className="comments-count">
                          <FontAwesomeIcon icon={faEnvelopeOpen} />{" "}
                          {post.comments_count}
                        </span>
                        <span className="timestamp">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Main + Right Column */}
        <div className="community-main-column">

          {/* SCROLL CONTAINER: header + tabs + content/right */}
          <div className="community-scrollable-content">

            {/* Header (scrolls away) */}
            <div className="community-appbar">
              <div className="community-info">
                <ProfilePicture
                  src={community?.logo}
                  isCommunity
                  className="community-logo"
                />
                <div>
                  <h1>{community?.name}</h1>
                  <div className="community-subtitle">
                    <RenderText text={`c/${community.slug}`} />
                    <span className="community-dot">·</span>
                    {community?.members_count} {`member`}{community?.members_count > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="community-actions">
                {community?.permissions?.can_add_tabs && (
                  <button
                    className="community-btn"
                    onClick={() => setShowAdd(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Tab
                  </button>
                )}
                {community?.permissions?.can_invite_members && (
                  <button
                    onClick={() => setShowInvite(true)}
                    className="community-btn"
                  >
                    <FontAwesomeIcon icon={faEnvelopeOpen} /> Invite
                  </button>
                )}
                <button
                  onClick={handleJoinLeave}
                  className={`community-btn ${community?.is_member
                      ? "community-btn-leave"
                      : "community-btn"
                    }`}
                >
                  {community?.is_member ? "Leave" : "Join"}
                </button>
              </div>
            </div>

            {/* Tabs (stick to top of scroll container) */}
            <nav className="community-tabs">
              <div className="community-tabs-left">
                {community?.tabs.map(tab => (
                  <button
                    key={tab.key}
                    className={`community-tab ${selectedTab?.key === tab.key ? "active" : ""
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
                  </button>
                ))}
              </div>
            </nav>

            {/* Content + Right Sidebar (scroll together) */}
            <div className="community-main-content-area">
              <main className="community-content">
                {selectedTab &&
                  TAB_COMPONENTS_FLAT[selectedTab.key] ? (
                  React.createElement(
                    TAB_COMPONENTS_FLAT[selectedTab.key].Component,
                    {
                      communitySlug: community?.slug,
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

              <aside className={`community-sidebar-right ${selectedTab?.key === 'home' ? 'community-home-right-sidebar' : ''}`}>
                <h3>About this community</h3>
                <p>
                  {community?.description ||
                    "No description provided."}
                </p>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      {showAdd && (
        <AddTabOverlay
          onClose={() => setShowAdd(false)}
          communitySlug={community?.slug}
          community={community}
          addTabs={addTabs}
        />
      )}
      {showInvite && <InviteOverlay onClose={() => setShowInvite(false)} />}
    </div>
  );
}
