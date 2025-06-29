import React, { useEffect, useState } from "react";
import "./exchangeBoard.css";
import { FiMessageCircle, FiArrowUp, FiArrowDown, FiShare2 } from "react-icons/fi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faPlus } from "@fortawesome/free-solid-svg-icons";
import RenderText from "../../../../../../utils/autoCompleteInput/renderText";
import { formatDateTime } from "../../../../../../utils/formatDateTime";
import ExchangeDetail from "./exchangeDetail/exchangeDetail";
import CreateDiscussionOverlay from "./createDiscussionOverlay/createDiscussionOverlay";
import { useCommunity } from "../../../../../../context/CommunityContext";
import { FaBookmark } from "react-icons/fa";
import { timeAgo } from "../../../../../../utils/convertDateTIme";

const Exchange = ({ communitySlug, community }) => {
  const { exchange } = useCommunity();
  const { posts, loading, error } = exchange;
  const [showForm, setShowForm] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#exchange-")) {
        setSelectedPostId(hash.replace("#exchange-", ""));
      } else {
        setSelectedPostId(null);
      }
    };

    handleHashChange(); // run once on mount
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
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
            posts.map(post => (
              <div
                className="discussion-card"
                key={post.id}
                onClick={() => {
                  setSelectedPostId(post.id);
                  window.location.hash = `#exchange-${post.id}`;
                }}
              >
                <div
                  className="save-discussion-post"
                  onClick={e => e.stopPropagation()}
                >
                  <FontAwesomeIcon icon={faBookmark} />
                </div>

                <div className="discussion-content">
                  {/* — Top meta: community + time ago + exact date */}
                  <div
                    className="discussion-meta-top"
                    onClick={e => e.stopPropagation()}
                  >
                    <RenderText
                      className="discussion-community"
                      text={`c/${community?.slug}`}
                    />
                    <span className="discussion-dot">•</span>
                    <span className="discussion-timeago">
                      {timeAgo(post.meta.created_at)}
                    </span>
                    <span className="discussion-dot">•</span>
                    <span className="discussion-datetime">
                      {formatDateTime(post.meta.created_at)}
                    </span>
                  </div>

                  <h2 className="discussion-title">
                    <RenderText text={post.title} />
                  </h2>

                  <div className="discussion-snippet">
                    <RenderText text={post.content} />
                  </div>

                  {/* — Bottom actions: votes, comments, share */}
                  <div
                    className="discussion-actions"
                    onClick={e => e.stopPropagation()}
                  >
                    <button className="discussion-vote-count-btn">
                      {post.stats.net_votes_count} {`vote${post.stats.net_votes_count !== 1 ? 's' : ''}`}
                    </button>
                    <button className="discussion-comment-count-btn">
                      <FiMessageCircle className="comment-icon" />
                      {post.stats.comments_count} {`comment${post.stats.comments_count !== 1 ? 's' : ''}`}
                    </button>
                    <button className="discussion-share-btn">
                      <FiShare2 />
                    </button>
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
