import React, { useEffect, useState } from 'react';
import useApi from '../../../../../../utils/useApi';
import './discussionBoard.css';
import { FiMessageCircle, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { FaRegUserCircle } from 'react-icons/fa';

const Discussion = ({ communityId }) => {
  const { callApi } = useApi();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const response = await callApi(`discussion/${communityId}/`);
        setPosts(response.data);
      } catch (err) {
        console.error('Failed to load discussion posts', err);
      }
    };
    fetchDiscussions();
  }, [communityId]);

  return (
    <div className="discussion-wrapper">
      {posts.length === 0 ? (
        <div className="empty-state">No discussions yet. Start one!</div>
      ) : (
        posts.map(post => (
          <div className="discussion-card" key={post.id}>
            <div className="discussion-header">
              <FaRegUserCircle className="user-icon" />
              <div className="meta">
                <span className="username">{post.author_username}</span>
                <span className="timestamp">{new Date(post.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="discussion-body">
              <h3 className="title">{post.title}</h3>
              {post.content && <p className="preview">{post.content.slice(0, 140)}...</p>}
            </div>
            <div className="discussion-footer">
              <div className="action">
                <FiArrowUp className="icon" />
                <span>{post.upvotes}</span>
                <FiArrowDown className="icon" />
              </div>
              <div className="action">
                <FiMessageCircle className="icon" />
                <span>{post.comments_count} comments</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Discussion;
