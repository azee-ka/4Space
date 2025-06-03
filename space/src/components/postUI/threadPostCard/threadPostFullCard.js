// ThreadPostFullCard.jsx

import React, { useRef, useState } from 'react';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import RenderText from '../../../utils/autoCompleteInput/renderText';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { Link, useNavigate } from 'react-router';
import {
  FaReply, FaRetweet, FaExpandAlt, FaMagic, FaEllipsisV, FaEdit, FaTrashAlt, FaFlag, FaBellSlash, FaBan, FaQuoteLeft
} from 'react-icons/fa';
import { formatDateTime } from '../../../utils/formatDateTime';
import { formatCount } from '../../../utils/formatCount';
import './threadPostFullCard.css';

// Only handles props - for feed cards
const ThreadPostFullCard = ({
  post,
  index,
  onExpand,
  onVote,
  onReply,
  onRepost,
  onBookmark,
  onMenu,
  isSelfPost,
}) => {
  const [showReplyField, setShowReplyField] = useState(false);
  const commentTextareaRef = useRef(null);
  const navigate = useNavigate();

  if (!post) return <div>Loading...</div>;

  const isRepost = post.is_repost && post.parent_post;
  const effectiveContent = isRepost ? post.parent_post.post : post.post || post.content;
  const effectiveAuthor = isRepost ? post.parent_post.author : post.author;

  return (
    <div className="timeline-per-post-wrapper">
      <div className="timeline-per-post">
        {isRepost && (
          <div className="repost-quote-block-banner" onClick={e => {
            e.stopPropagation();
            navigate(`/posts/p/${post.parent_post.id}`);
          }}>
            <FaRetweet />
            <span>Repost</span>
          </div>
        )}
        {post?.parent_post && post?.quote_text && (
          <div className="repost-quote-block-banner" onClick={e => {
            e.stopPropagation();
            navigate(`/posts/p/${post.parent_post.id}`);
          }}>
            <FaQuoteLeft />
            <span>Quote</span>
          </div>
        )}

        {/* User Info */}
        <div className="timeline-post-user-info">
          <div className="timeline-post-user-details">
            <div className="user-profile-wrapper">
              <ProfilePicture src={post.author?.profile_image} />
            </div>
            <div className="user-info-text">
              <Link to={`/profile/${effectiveAuthor?.username}`}>@{effectiveAuthor?.username}</Link>
              <p className="post-time">{formatDateTime(post?.meta?.created_at, true)}</p>
            </div>
          </div>
          <div className="timeline-post-stats">
            <div className="stat-item">
              <strong>{post?.stats?.likes_count || 0}</strong>
              <span>Likes</span>
            </div>
            <div className="stat-item">
              <strong>{post?.stats?.dislikes_count || 0}</strong>
              <span>Dislikes</span>
            </div>
            <div className="stat-item" onClick={onExpand}>
              <strong>{post?.stats?.comments_count || 0}</strong>
              <span>Comments</span>
            </div>
          </div>
        </div>

        {/* Main Thread Content */}
        <div className="timeline-thread-post">
          <div className="thread-post-body">
            <div className="thread-content">
              {post?.parent_post && post?.quote_text && (
                <div className="quote-block"
                  onClick={e => {
                    e.stopPropagation();
                    navigate(`/posts/p/${post?.parent_post?.id}`);
                  }}>
                  <div className="quote-meta">
                    <ProfilePicture src={post.parent_post.author.profile_image} small />
                    <span className="quote-username">@{post.parent_post.author.username}</span>
                    <span className="quote-date">{formatDateTime(post?.parent_post?.meta?.created_at, true)}</span>
                  </div>
                  <blockquote className="quote-text">{post.quote_text}</blockquote>
                </div>
              )}
              {post.quote_comment && (
                <div className="quoted-user-comment">{post.quote_comment}</div>
              )}
              <RenderText text={effectiveContent?.content || effectiveContent?.caption || post.content || ""} />
            </div>
            <div className="thread-vote-buttons">
              <button className={`vote-btn ${post?.status?.vote_status === "upvoted" ? 'active' : ''}`}
                onClick={() => onVote && onVote('upvote')}>
                <span className="icon-style">▲</span>
              </button>
              <div className="vote-count">
                {formatCount(post?.stats?.net_votes_count) || 0}
              </div>
              <button className={`vote-btn ${post?.status?.vote_status === "downvoted" ? 'active' : ''}`}
                onClick={() => onVote && onVote('downvote')}>
                <span className="icon-style">▼</span>
              </button>
            </div>
          </div>
          <div className="thread-post-stats timeline">
            <div><span>{formatCount(post?.stats?.reposts_count) ?? 0}</span> Repost{post?.stats?.reposts_count > 1 ? 's' : ''}</div>
            <div><span>{formatCount(post?.stats?.views_count) ?? 0}</span> View{post?.stats?.views_count > 1 ? 's' : ''}</div>
          </div>
          <div className="thread-actions-row">
            <button className="thread-action-btn" onClick={() => setShowReplyField(v => !v)}>
              <FaReply className="icon-style" /> Reply
            </button>
            <button className="thread-action-btn" onClick={onRepost}>
              <FaRetweet className="icon-style" /> Repost
            </button>
            <button className="thread-action-btn" onClick={onExpand}>
              <FaExpandAlt className="icon-style" /> Expand
            </button>
            <button className="thread-action-btn">
              <FaMagic className="icon-style" /> AI Insight
            </button>
            <DropdownButton
              toggleContent={
                <button className="thread-action-btn"><FaEllipsisV /></button>
              }
            >
              <div className="timeline-post-more-options-card">
                <ul>
                  {isSelfPost && (
                    <li>
                      <button className="more-options-card-btn"><FaEdit /> Edit Post</button>
                    </li>
                  )}
                  {isSelfPost && (
                    <li>
                      <button className="more-options-card-btn"><FaTrashAlt /> Delete</button>
                    </li>
                  )}
                  {!isSelfPost && (
                    <li>
                      <button className="more-options-card-btn"><FaFlag /> Report</button>
                    </li>
                  )}
                  {!isSelfPost && (
                    <li>
                      <button className="more-options-card-btn"><FaBellSlash /> Mute Author</button>
                    </li>
                  )}
                  {!isSelfPost && (
                    <li>
                      <button className="more-options-card-btn"><FaBan /> Block Author</button>
                    </li>
                  )}
                </ul>
              </div>
            </DropdownButton>
          </div>
          {/* Inline Reply Field */}
          {showReplyField && (
            <div className="thread-post-reply-container">
              <div className="thread-post-reply">
                <textarea
                  ref={commentTextareaRef}
                  placeholder="Comment here..."
                  rows={2}
                />
                <button>Reply</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadPostFullCard;
