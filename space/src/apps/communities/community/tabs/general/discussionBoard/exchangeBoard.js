import React, { useEffect, useState } from 'react';
import './exchangeBoard.css';
import { FiMessageCircle, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import RenderText from '../../../../../../utils/autoCompleteInput/renderText';
import { formatDateTime } from '../../../../../../utils/formatDateTime';
import ProfilePicture from '../../../../../../utils/profilePicture/getProfilePicture';
import ExchangeDetail from './exchangeDetail/exchangeDetail';
import CreateDiscussionOverlay from './createDiscussionOverlay/createDiscussionOverlay';
import { useCommunity } from '../../../../../../context/CommunityContext';

const Exchange = ({ communityId, community }) => {
  const { exchange } = useCommunity();
  const [showForm, setShowForm] = useState(false);

  // On mount: check hash for detail view
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#exchange-')) {
      const postId = hash.replace('#exchange-', '');
      exchange.setSelectedPostId(postId);
    }
    // Also: fetch posts!
    exchange.fetchExchanges();
    // eslint-disable-next-line
  }, [communityId]);

  const posts = exchange.posts;
  const selectedPostId = exchange.selectedPostId;
  const setSelectedPostId = exchange.setSelectedPostId;

  return (
    <>
    <div className="discussion-wrapper">
      {!selectedPostId && <h3>Exchanges</h3>}
      <div className="discussion-feed">
        {(!posts || posts.length === 0) ? (
          <div className="empty-state">No discussions yet. Be the first to start one.</div>
        ) : selectedPostId ? (
          <ExchangeDetail
            postId={selectedPostId}
            embedded={true}
            onClose={() => {
              setSelectedPostId(null);
              window.location.hash = '#exchange';
            }}
          />
        ) : (
          posts.map(post => (
            <div className="discussion-card"
              key={post.id}
              onClick={() => {
                window.location.hash = `exchange-${post.id}`;
                setSelectedPostId(post.id);
              }}
            >
              <div className="discussion-vote-panel" onClick={e => e.stopPropagation()}>
                <FiArrowUp className="icon vote-icon" />
                <span>{post.upvotes}</span>
                <FiArrowDown className="icon vote-icon" />
              </div>
              <div className="discussion-content">
                <div className="discussion-header">
                  <div className="user-icon">
                    <ProfilePicture src={post?.author?.profile_image} />
                  </div>
                  <div className="meta">
                    <span className="username">@{post?.author?.username}</span>
                    <span className="timestamp">{formatDateTime(post.created_at, true)}</span>
                  </div>
                </div>
                <div className="discussion-body">
                  <RenderText text={post.title} />
                  <div className="preview">
                    <RenderText text={post.content} />
                  </div>
                </div>
                <div className="discussion-footer">
                  <div className="action">
                    <FiMessageCircle className="icon" />
                    <span>{post.comments_count} comments</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    {community?.permissions?.can_post_discussions && (
        <>
          <button className="floating-discussion-btn" onClick={() => setShowForm(true)}>
            <FontAwesomeIcon icon={faPlus} />
          </button>
          {showForm && (
            <CreateDiscussionOverlay
              onClose={() => setShowForm(false)}
              communityId={communityId}
              onPostCreated={post => exchange.setPosts([post, ...exchange.posts])}
            />
          )}
        </>
      )}
    </>
  );
};

export default Exchange;
