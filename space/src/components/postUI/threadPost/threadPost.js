import React, { useEffect, useRef, useState } from 'react';
import './threadPost.css';
import useApi from '../../../utils/useApi';
import { useExpandPostContext } from '../expandPost/expandPostContext';
import RenderText from '../../../utils/autoCompleteInput/renderText';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { FaHeart, FaCommentDots, FaRetweet, FaBookmark, FaShareAlt, FaArrowUp, FaArrowDown, FaReply, FaFlag, FaQuoteRight, FaBell, FaLanguage, FaRobot, FaPencilRuler, FaEyeSlash, FaLink, FaChevronUp, FaSmile } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/formatDateTime';
import CustomEditor from '../../../utils/editor/editor';
import EmojiButton from '../../../utils/editor/EmojiButton';
import CustomTextarea from '../../../pages/messages/chatContainer/customTextarea';
import { formatCount } from '../../../utils/formatCount';
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger';

const ThreadPost = () => {
    const {
        post,
        postBookmarked,
        commentText,
        commentReplyText,
        showLikesOverlay,
        showDislikesOverlay,
        setCommentText,
        setShowLikesOverlay,
        setShowDislikesOverlay,
        toggleLikeDislike,
        deletePost,
        toggleBookmark,
        addComment,
        voteComment,
        toggleCommentLike,
        replyToComment,
        votePost,
        navigateMedia,
        renderMediaContent,
        handleCloseLikesOverlay,

        comments,
        loadMoreComments,
        commentsHasMore,
        commentsLoading,
        commentsTotalCount,

        repostPost,
        showQuoteModal,
        setShowQuoteModal,
    } = useExpandPostContext();

    const endOfCommentsRef = useInfiniteScrollTrigger(loadMoreComments, commentsHasMore, commentsLoading);

    const [replyText, setReplyText] = useState('');


    const commentTextareaRef = useRef(null);


    useEffect(() => {
        if (post) {
            console.log('ThreadPost component loaded', post);
        }
    }, [post]);

    return post ? (
        <div className="thread-post-page">
            <div className="thread-post-container">
                {/* Author Info */}
                <div className="thread-post-author">
                    <div className="author-profile-image">
                        <ProfilePicture src={post?.author?.profile_image} />
                    </div>
                    <div className="author-info">
                        <h3>@{post?.author?.username}</h3>
                        <p className="post-date">
                            {formatDateTime(post?.meta?.created_at, true)}
                        </p>
                    </div>
                </div>

                {/* Post Content */}
                <div className="thread-post-content">
{post.parent_post && (
  <div className={`referenced-post-card ${post.quote_comment ? 'is-quote' : 'is-repost'}`}>
    <div className="referenced-post-author">
      <ProfilePicture src={post.parent_post?.author?.profile_image} />
      <span>@{post.parent_post?.author?.username}</span>
    </div>
    <div className="referenced-post-content">
      <RenderText text={post.parent_post?.content} />
    </div>
  </div>
)}
{post.quote_comment && (
  <div className="quoted-user-comment">{post.quote_comment}</div>
)}

                    <RenderText text={post?.post?.content} />
                </div>

                {/* Stats */}
                <div className="thread-post-stats">
                    <div><span>{formatCount(post?.stats?.likes_count) ?? 0}</span> Likes</div>
                    <div><span>{formatCount(post?.stats?.comments_count) ?? 0}</span> Comments</div>
                    <div><span>{formatCount(post?.stats?.reposts_count) ?? 0}</span> Reposts</div>
                    <div><span>{formatCount(post?.stats?.views_count) ?? 0}</span> Views</div>
                </div>

                {/* Voting + Content Box */}
                <div className="thread-post-main-interactions">
                    {/* Left side: Votes */}
                    <div className="vote-box">
                        <button className={`vote-btn ${post?.status?.vote_status === "upvoted" ? 'active' : ''}`} onClick={() => votePost('upvote')}>
                            <FaArrowUp className="icon-style" />
                        </button>
                        <div className="vote-count">
                            {formatCount(post?.stats?.net_votes_count) || 0}
                        </div>
                        <button className={`vote-btn ${post?.status?.vote_status === "downvoted" ? 'active' : ''}`} onClick={() => votePost('downvote')}>
                            <FaArrowDown className="icon-style" />
                        </button>
                    </div>

                    {/* Right side: Actions + Reply */}
                    <div className="action-and-reply-box">
                        <div className="thread-post-actions">
                            <button className={`action-btn ${post?.status?.like_status === 'liked' ? 'active' : ''}`} onClick={() => toggleLikeDislike('like')}>
                                <FaHeart className="icon-style" /> Like
                            </button>
                            <button className="action-btn" onClick={repostPost}>
                                <FaRetweet className="icon-style" /> Repost
                            </button>
                            <button className="action-btn" onClick={() => setShowQuoteModal(true)}>
                                <FaQuoteRight className="icon-style" /> Quote
                            </button>

                            <button className="action-btn">
                                <FaBookmark className="icon-style" /> Save
                            </button>
                            <button className="action-btn">
                                <FaShareAlt className="icon-style" /> Share
                            </button>
                            <button className="action-btn"><FaEyeSlash /> Hide</button>
                            <button className="action-btn"><FaFlag /> Report</button>
                            <button className="action-btn"><FaBookmark /> Bookmark</button>
                            <button className="action-btn"><FaBell /> Notify</button>
                            <button className="action-btn"><FaLanguage /> Translate</button>
                            <button className="action-btn"><FaRobot /> Summarize</button>
                            <button className="action-btn"><FaPencilRuler /> Remix</button>
                        </div>
                    </div>
                </div>

                {/* Reply field */}
                <div className="thread-post-reply-container">
                    <div className="thread-post-reply">
                        <EmojiButton inputRef={commentTextareaRef} value={commentText} onChange={setCommentText} />
                        <CustomTextarea
                            ref={commentTextareaRef}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Comment here..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (commentText.trim()) {
                                        addComment();
                                    }
                                }
                            }}
                        />
                    </div>
                    {(commentText !== '' || commentText === "<p><br></p>") &&
                        <button onClick={addComment}>Reply</button>
                    }
                </div>

                {/* Comments List */}
                <div className="thread-post-comments">
                    <p className="comments-heading">Comments {commentsTotalCount ? <span>({formatCount(commentsTotalCount)})</span> : ""}</p>
                    {comments.length > 0 ? (
                        comments.map((comment, idx) => (
                            <div
                                key={comment.id}
                                className="comment-item"
                                ref={idx === comments.length - 1 ? endOfCommentsRef : null}
                            >
                                <div className="comment-main-row">
                                    {/* VOTE BOX - VERTICAL */}
                                    <div className="comment-vote-box">
                                        <button
                                            className={`comment-vote-btn ${comment?.vote_status === "upvoted" ? 'active' : ''}`}
                                            onClick={() => voteComment(comment?.id, 'upvote')}
                                        >
                                            <FaArrowUp className="icon-style" />
                                        </button>
                                        <div className="comment-vote-count">
                                            {formatCount(comment.net_votes_count) ?? 0}
                                        </div>
                                        <button
                                            className={`comment-vote-btn ${comment?.vote_status === "downvoted" ? 'active' : ''}`}
                                            onClick={() => voteComment(comment?.id, 'downvote')}
                                        >
                                            <FaArrowDown className="icon-style" />
                                        </button>
                                    </div>
                                    {/* Comment Content/Meta */}
                                    <div className="comment-main-content">
                                        <div className="comment-header">
                                            <div className="comment-profile-image">
                                                <ProfilePicture src={comment.author?.profile_image} />
                                            </div>
                                            <div className="comment-author-info">
                                                <span className="comment-username">@{comment.author?.username}</span>
                                                <span className="comment-time">{formatDateTime(comment.created_at, true)}</span>
                                            </div>
                                        </div>
                                        <div className="comment-text">
                                            <RenderText text={comment.text} />
                                        </div>
                                    </div>
                                </div>
                                {/* Actions row without upvote/downvote */}
                                <div className="comment-actions-row">
                                    <button
                                        className={`comment-action-btn ${comment.like_status === 'liked' ? 'liked' : ''}`}
                                        onClick={() => toggleCommentLike(comment.id)}>
                                        <FaHeart className='icon-style' />
                                        Like
                                        {comment.likes_count > 0 && (
                                            <span className="comment-like-count">{formatCount(comment.likes_count)}</span>
                                        )}
                                    </button>
                                    <button className="comment-action-btn"><FaReply /> Reply</button>
                                    <button className="comment-action-btn"><FaFlag /> Report</button>
                                    <button className="comment-action-btn"><FaQuoteRight /> Quote</button>
                                    <button className="comment-action-btn"><FaLanguage /> Translate</button>
                                    <button className="comment-action-btn"><FaSmile /> React</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-comments">No comments yet. Be the first to reply!</div>
                    )}
                    {commentsLoading && <div className="loading-comments">Loading...</div>}
                    {!commentsHasMore && comments.length > 0 && (
                        <div className="no-more-comments">All comments loaded.</div>
                    )}
                </div>
            </div>
        </div>
    ) : (
        <div className="loading-thread-post">Loading...</div>
    );
};

export default ThreadPost;
