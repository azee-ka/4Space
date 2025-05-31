import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './threadPost.scss';
import useApi from '../../../utils/useApi';
import { useExpandPostContext } from '../expandPost/expandPostContext';
import RenderText from '../../../utils/autoCompleteInput/renderText';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { FaHeart, FaCommentDots, FaRetweet, FaBookmark, FaShareAlt, FaArrowUp, FaArrowDown, FaReply, FaFlag, FaQuoteRight, FaBell, FaLanguage, FaRobot, FaPencilRuler, FaEyeSlash, FaLink, FaChevronUp, FaSmile, FaQuoteLeft } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/formatDateTime';
import CustomEditor from '../../../utils/editor/editor';
import EmojiButton from '../../../utils/editor/EmojiButton';
import CustomTextarea from '../../../pages/messages/chatContainer/customTextarea';
import { formatCount } from '../../../utils/formatCount';
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger';
import { Link, useNavigate } from 'react-router-dom';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { useTrackPostView } from '../../../hooks/useTrackPostView';

const ThreadPost = () => {
    const {
        post,
        setPost,
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

        showQuoteModal,
        setShowQuoteModal,
        quoteText,
        setQuoteText,
        handleSelection,
        showQuoteBtn,
        setShowQuoteBtn,
        btnPos,
        setBtnPos,
        selectedText,
        setSelectedText,

        setShowRepostModal,
    } = useExpandPostContext();

    const navigate = useNavigate();

    const endOfCommentsRef = useInfiniteScrollTrigger(loadMoreComments, commentsHasMore, commentsLoading);

    useTrackPostView(post?.id, !!post, setPost);

    const commentTextareaRef = useRef(null);

    const contentRef = useRef(null);

    useEffect(() => {
        const handler = handleSelection(contentRef);
        document.addEventListener('mouseup', handler);
        document.addEventListener('keyup', handler);
        return () => {
            document.removeEventListener('mouseup', handler);
            document.removeEventListener('keyup', handler);
            document.querySelectorAll('[data-quote-anchor="true"]').forEach(el => el.remove());
        };
    }, [handleSelection]);


    useEffect(() => {
        if (post) {
            console.log('ThreadPost component loaded', post);
        }
    }, [post]);


    if (!post || (!post.post && !(post.is_repost && post.parent_post && post.parent_post.post))) {
        return <div className="loading-thread-post">Loading...</div>;
    }

    const isRepost = post.is_repost && post.parent_post;
    const effectiveContent = isRepost ? post.parent_post.post : post.post;
    const effectiveAuthor = isRepost ? post.parent_post.author : post.author;


    return post ? (
        <div className="thread-post-page">
            <div className="thread-post-container">
                {post?.is_repost && post?.parent_post && (
                    <div className="repost-quote-block-banner" onClick={e => {
                        e.stopPropagation();
                        navigate(`/posts/p/${post?.parent_post?.id}`);
                    }}
                    >
                        <FaRetweet />
                        <span>Repost</span>
                    </div>
                )}
                {post?.parent_post && post?.quote_text && (
                                    <div className="repost-quote-block-banner" onClick={e => {
                                        e.stopPropagation();
                                        navigate(`/posts/p/${post?.parent_post?.id}`);
                                    }}
                                    >
                                        <FaQuoteLeft />
                                        <span>Quote</span>
                                    </div>
                    )}

                {/* Author Info */}
                <div className="thread-post-author">
                    <Link to={`/profile/${effectiveAuthor?.username}`}>
                        <div className="author-profile-image">
                            <ProfilePicture src={effectiveAuthor?.profile_image} />
                        </div>
                    </Link>
                    <div className="author-info">
                        <Link to={`/profile/${effectiveAuthor?.username}`}>
                            <h3>@{effectiveAuthor?.username}</h3>
                        </Link>
                        <p className="post-date">
                            {formatDateTime(post?.meta?.created_at, true)}
                        </p>
                    </div>
                </div>

                {/* Post Content */}
                <div className="thread-post-content" ref={contentRef}>
                    {post?.parent_post && post?.quote_text && (
                        <>
                            <div className="quote-block" onClick={e => {
                                        e.stopPropagation();
                                        navigate(`/posts/p/${post?.parent_post?.id}`);
                                    }}
                                    >
                                <div className="quote-meta">
                                    <ProfilePicture src={post.parent_post.author.profile_image} small />
                                    <span className="quote-username">@{post.parent_post.author.username}</span>
                                    <span className="quote-date">{formatDateTime(post?.parent_post?.meta?.created_at, true)}</span>
                                </div>
                                <blockquote className="quote-text">{post.quote_text}</blockquote>
                            </div>
                        </>
                    )}
                    {post.quote_comment && (
                        <div className="quoted-user-comment">{post.quote_comment}</div>
                    )}


                    <RenderText text={effectiveContent?.content || effectiveContent?.caption || ""} />
                    {showQuoteBtn && btnPos && ReactDOM.createPortal(
                        <button
                            className="floating-quote-btn"
                            style={{
                                position: 'absolute',
                                top: btnPos.top,
                                left: btnPos.left,
                                transform: 'translate(-50%, 150%)',
                                zIndex: 100,
                            }}
                            onClick={() => {
                                setShowQuoteModal(true);
                                setQuoteText(selectedText);
                                setShowQuoteBtn(false);
                                document.querySelectorAll('[data-quote-anchor="true"]').forEach(el => el.remove());
                            }}
                        >
                            <FaQuoteRight style={{ marginRight: 4, fontSize: '1.1em' }} /> Quote
                        </button>,
                        document.body
                    )}
                </div>

                {/* Stats */}
                <div className="thread-post-stats">
                    <div><span>{formatCount(post?.stats?.likes_count) ?? 0}</span> Like{post?.stats?.likes_count > 1 ? 's' : ''}</div>
                    <div><span>{formatCount(post?.stats?.comments_count) ?? 0}</span> Comment{post?.stats?.comments_count > 1 ? 's' : ''}</div>
                    <div><span>{formatCount(post?.stats?.reposts_count) ?? 0}</span> Repost{post?.stats?.reposts_count > 1 ? 's' : ''}</div>
                    <div><span>{formatCount(post?.stats?.views_count) ?? 0}</span> View{post?.stats?.views_count > 1 ? 's' : ''}</div>
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
                            <button className="action-btn" onClick={() => setShowRepostModal(true)}>
                                <FaRetweet className="icon-style" /> Repost
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
                                            <Link to={`/profile/${comment.author?.username}`}>
                                                <div className="comment-profile-image">
                                                    <ProfilePicture src={comment.author?.profile_image} />
                                                </div>
                                            </Link>
                                            <div className="comment-author-info">
                                                <Link to={`/profile/${comment.author?.username}`}>
                                                    <span className="comment-username">@{comment.author?.username}</span>
                                                </Link>
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
