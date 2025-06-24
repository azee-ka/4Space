import React, { useEffect, useState } from "react";
import "./exchangeBoard.css";
import { FiMessageCircle, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faPlus } from "@fortawesome/free-solid-svg-icons";
import RenderText from "../../../../../../utils/autoCompleteInput/renderText";
import { formatDateTime } from "../../../../../../utils/formatDateTime";
import ExchangeDetail from "./exchangeDetail/exchangeDetail";
import CreateDiscussionOverlay from "./createDiscussionOverlay/createDiscussionOverlay";
import { useCommunity } from "../../../../../../context/CommunityContext";
import { FaBookmark } from "react-icons/fa";

const Exchange = ({ communitySlug, community }) => {
  const { exchange } = useCommunity();
  const { posts, loading, error } = exchange;
  const [showForm, setShowForm] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#exchange-")) {
      setSelectedPostId(hash.replace("#exchange-", ""));
    }
  }, []);

  if (loading) return <div className="discussion-loading">Loading discussions…</div>;
  if (error) return <div className="discussion-error">Failed to load discussions.</div>;

  return (
    <>
      <div className="discussion-wrapper">
        {!selectedPostId && <h3>Exchanges</h3>}
        <div className="discussion-feed">
          {selectedPostId ? (
            <ExchangeDetail
              postId={selectedPostId}
              embedded={true}
              onClose={() => {
                setSelectedPostId(null);
                window.location.hash = "#exchange";
              }}
            />
          ) : posts.length === 0 ? (
            <div className="empty-state">
              No discussions yet. Be the first to start one.
            </div>
          ) : (
            posts.map((post) => (
              <div
                className="discussion-card"
                key={post.id}
                onClick={() => {
                  setSelectedPostId(post.id);
                  window.location.hash = `exchange-${post.id}`;
                }}
              >
                <div className="discussion-vote-panel-wrapper" onClick={(e) => e.stopPropagation()}>
                <div className="discussion-vote-panel" onClick={(e) => e.stopPropagation()}>
                  <FiArrowUp className="icon vote-icon" />
                  <span className="vote-count">{post.upvotes}</span>
                  <FiArrowDown className="icon vote-icon" />
                </div>
                <div className="save-discussion-post" onClick={(e) => e.stopPropagation()}>
                  <FontAwesomeIcon icon={post?.saved ? faBookmark : faBookmark} />
                  </div>
                </div>

                <div className="discussion-content">
                  <div className="discussion-community"  onClick={(e) => e.stopPropagation()}>
                    <RenderText text={`c/${community?.slug}`} />
                  </div>
                  <h2 className="discussion-title">
                    <RenderText text={post.title} />
                  </h2>
                  <div className="discussion-snippet">
                    <RenderText text={post.content} />
                  </div>
                  <div className="discussion-footer" onClick={(e) => e.stopPropagation()}>
                    <span className="footer-item">
                      <RenderText text={`u/${post.author.username}`} />
                    </span>
                    <span>•</span>
                    <span className="footer-item">{formatDateTime(post.created_at, true)}</span>
                    <span>•</span>
                    <span className="footer-item comments-count">
                      <FiMessageCircle className="comment-icon" /> {post.comments_count}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {community?.permissions?.can_post_discussions && (
        <>
          <button
            className="floating-discussion-btn"
            onClick={() => setShowForm(true)}
            aria-label="New discussion"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          {showForm && (
            <CreateDiscussionOverlay
              onClose={() => setShowForm(false)}
              communitySlug={communitySlug}
              onPostCreated={(post) => {
                setSelectedPostId(post.id);
                window.location.hash = `exchange-${post.id}`;
                setShowForm(false);
              }}
            />
          )}
        </>
      )}
    </>
  );
};

export default Exchange;
