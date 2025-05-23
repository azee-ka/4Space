import React, { useEffect, useState } from 'react';
import useApi from '../../../../../../utils/useApi';
import './exchangeBoard.css';
import { FiMessageCircle, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { FaRegUserCircle } from 'react-icons/fa';
import CreateDiscussionOverlay from './createDiscussionOverlay/createDiscussionOverlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import RenderText from '../../../../../../utils/autoCompleteInput/renderText';
import { formatDateTime } from '../../../../../../utils/formatDateTime';
import ProfilePicture from '../../../../../../utils/profilePicture/getProfilePicture';
import ExchangeDetail from './exchangeDetail/exchangeDetail';

const Exchange = ({ communityId, community }) => {
  const { callApi } = useApi();
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [selectedPostId, setSelectedPostId] = useState(null);


  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#exchange-')) {
      const postId = hash.replace('#exchange-', '');
      setSelectedPostId(postId);
    }
  }, []);



  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const response = await callApi(`community/${communityId}/exchanges/list/`);
        setPosts(response.data);
        console.log(response.data);
      } catch (err) {
        console.error('Failed to load discussion posts', err);
      }
    };
    fetchExchanges();
  }, [communityId]);

  return (
    <div className="discussion-wrapper">
      {!selectedPostId &&
        <h3>Exchange</h3>
      }
      <div className="discussion-feed">
        {posts?.length === 0 ? (
          <div className="empty-state">No discussions yet. Be the first to start one.</div>
        ) : (
          selectedPostId ? (
            <ExchangeDetail
              postId={selectedPostId}
              embedded={true}
              onClose={() => {
                setSelectedPostId(null);

                // Preserve tab hash, strip only post ID part
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
                <div className="discussion-vote-panel">
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
          )
        )}
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
              onPostCreated={(post) => setPosts([post, ...posts])}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Exchange;
