import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import DOMPurify from 'dompurify';
import './timelinePerPost.css';
import ProfilePicture from '../../../../utils/profilePicture/getProfilePicture';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft, faShareAlt, faBookmark, faEllipsisV, faHeart, faReply, faArrowRight, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import unliked from '../../../../assets/unliked.png';
import undisliked from '../../../../assets/undisliked.png';
import liked from '../../../../assets/liked.png';
import disliked from '../../../../assets/disliked.png';
import UserListOverlay from '../../../../components/userListOverlay/userListOverlay';
import { Link, useNavigate } from 'react-router';
import { timeAgo } from '../../../../utils/convertDateTIme';
import { usePostContext } from '../../../../context/PostContext';
import { useExpandPostContext } from '../../../../components/postUI/expandPost/expandPostContext';
import { FaArrowDown, FaArrowUp, FaBan, FaBellSlash, FaBookmark, FaChevronLeft, FaChevronRight, FaCommentDots, FaEdit, FaEllipsisH, FaEllipsisV, FaExpandAlt, FaExpandArrowsAlt, FaFlag, FaHeart, FaMagic, FaPaperPlane, FaQuoteLeft, FaQuoteRight, FaReply, FaRetweet, FaShareAlt, FaTrashAlt, FaVolumeMute } from 'react-icons/fa';
import RenderText from '../../../../utils/autoCompleteInput/renderText';
import DropdownButton from '../../../../utils/popperButton/DropdownButton';
import { formatDateTime } from '../../../../utils/formatDateTime';
import { formatCount } from '../../../../utils/formatCount';
import EmojiButton from '../../../../utils/editor/EmojiButton';
import CustomTextarea from '../../../../pages/messages/chatContainer/customTextarea';
import { useTrackPostView } from '../../../../hooks/useTrackPostView';

const TimelinePerPost = ({ postId, posts, index, activeFilter }) => {
    const { handleExpandPostOpen } = usePostContext();

    const {
        post,
        setPost,
        replyToComment,
        setCommentReplyText,
        commentReplyText,
        postBookmarked,
        commentText,
        showLikesOverlay,
        showDislikesOverlay,
        currentMediaIndex,
        setCommentText,
        setShowLikesOverlay,
        setShowDislikesOverlay,
        toggleLikeDislike,
        votePost,
        toggleBookmark,
        addComment,
        navigateMedia,
        renderMediaContent,
        handleCloseLikesOverlay,
        isSelfPost,
        deletePost,

        handleSelection,
        showQuoteBtn,
        setShowQuoteBtn,
        btnPos,
        setBtnPos,
        selectedText,
        setSelectedText,
        showQuoteModal,
        setShowQuoteModal,
        setQuoteText
    } = useExpandPostContext();

    useTrackPostView(post?.id, !!post, setPost);

    const navigate = useNavigate();

    const [showReplyField, setShowReplyField] = useState(false);
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


    const handlePostClick = (index, post_type) => {
        let filteredPosts = posts;

        if (post_type === 'Visual') {
            filteredPosts = posts.filter(p => p.post_type === 'Visual');
        }

        handleExpandPostOpen(postId, filteredPosts, window.location.pathname + window.location.hash, index, post_type);
    };


    if (!post || (!post.post && !(post.is_repost && post.parent_post && post.parent_post.post))) {
        return <div>Loading...</div>;
    }

    const isRepost = post.is_repost && post.parent_post;
    const effectiveContent = isRepost ? post.parent_post.post : post.post;
    const effectiveAuthor = isRepost ? post.parent_post.author : post.author;


    // console.log('TimelinePerPost post:', post);

    return post ? (
        <div className="timeline-per-post-wrapper">

            {/* Main Post Card */}
            <div className="timeline-per-post">

                {isRepost && post.parent_post && (
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
                <div className="timeline-post-user-info">
                    <div className="timeline-post-user-details">
                        <div className="user-profile-wrapper">
                            <ProfilePicture src={post?.author?.profile_image} />
                        </div>
                        <div className="user-info-text">
                            <Link to={`/profile/${effectiveAuthor?.username}`}>@{effectiveAuthor?.username}</Link>
                            <p className="post-time">{formatDateTime(post?.meta?.created_at, true)}</p>
                        </div>
                    </div>

                    {/* Post Stats Section */}
                    <div className="timeline-post-stats">
                        <div className="stat-item" onClick={() => setShowLikesOverlay(true)}>
                            <strong>{post?.stats?.likes_count || 0}</strong>
                            <span>Likes</span>
                        </div>
                        <div className="stat-item" onClick={() => setShowDislikesOverlay(true)}>
                            <strong>{post?.stats?.dislikes_count || 0}</strong>
                            <span>Dislikes</span>
                        </div>
                        <div className="stat-item" onClick={() => handlePostClick(index, post.post_type)}>
                            <strong>{post?.stats?.comments_count || 0}</strong>
                            <span>Comments</span>
                        </div>
                    </div>
                </div>

                {post?.post_type === 'Visual' && (activeFilter === 'Visual' || activeFilter === 'All') && (
                    <div className="timeline-visual-post">
                        <div className="media-container">
                            {renderMediaContent(post?.post?.media_files[currentMediaIndex])}
                            <div className="media-nav-buttons">
                                {(currentMediaIndex < (post?.post?.media_files?.length || 0) - 1) && !(currentMediaIndex > 0) && (
                                    <div></div>
                                )}
                                {currentMediaIndex > 0 && (
                                    <button onClick={() => navigateMedia('prev')}><FaChevronLeft /></button>
                                )}
                                {(currentMediaIndex < (post?.post?.media_files?.length || 0) - 1) && (
                                    <button onClick={() => navigateMedia('next')}><FaChevronRight /></button>
                                )}
                                {(currentMediaIndex > 0) && !(currentMediaIndex < (post?.post?.media_files?.length || 0) - 1) && (
                                    <div></div>
                                )}

                            </div>
                        </div>

                        <div className="timeline-caption-and-comment">
                            <div className="caption-block">
                                <Link to={`/profile/${post?.author?.username}`} className="username">@{post?.author?.username}</Link>
                                <RenderText text={post?.post?.caption} />
                            </div>

                            <div className="view-comments" onClick={() => handlePostClick(index, post.post_type)}>
                                View {post?.comments?.length || 0} Comments
                            </div>

                            <div className="comment-input-wrapper">
                                <input
                                    placeholder="Write your comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <button onClick={addComment}>
                                    <FaPaperPlane />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {post?.post_type === 'Thread' && (activeFilter === 'Thread' || activeFilter === 'All') && (
                    <div className="timeline-thread-post">
                        <div className="thread-post-body">
                            <div className="thread-content" ref={contentRef}>
                                {post?.parent_post && post?.quote_text && (
                                    <div className="quote-block"
                                        onClick={e => {
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
                            <div className="thread-vote-buttons">
                                <div className="thread-vote-buttons">
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
                            </div>
                        </div>
                        <div className="thread-post-stats timeline">
                            <div><span>{formatCount(post?.stats?.reposts_count) ?? 0}</span> Repost{post?.stats?.reposts_count > 1 ? 's' : ''}</div>
                            <div><span>{formatCount(post?.stats?.views_count) ?? 0}</span> View{post?.stats?.views_count > 1 ? 's' : ''}</div>
                        </div>
                        <div className="thread-actions-row">
                            <button
                                className="thread-action-btn"
                                onClick={() => setShowReplyField(v => !v)}
                            >
                                <FaReply className="icon-style" />
                                Reply
                            </button>
                            <button className="thread-action-btn">
                                <FaRetweet className="icon-style" />
                                Repost
                            </button>
                            <button onClick={() => handlePostClick(index, post.post_type)} className="thread-action-btn">
                                <FaExpandAlt className="icon-style" />
                                Expand
                            </button>
                            <button className="thread-action-btn"><FaMagic className="icon-style" /> AI Insight</button>
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
                                                <button className="more-options-card-btn" onClick={() => deletePost(postId)}><FaTrashAlt /> Delete</button>
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
                        {(
                            <div className={`thread-post-reply-container ${showReplyField ? '' : 'hide'}`}>
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
                        )}

                    </div>
                )}
            </div>

            {/* Floating Buttons Separate */}
            <div className="timeline-floating-actions">
                <div onClick={() => toggleLikeDislike('like')} className="float-btn">
                    <img src={post?.status?.like_status === 'liked' ? liked : unliked} />
                </div>
                <div onClick={() => toggleLikeDislike('dislike')} className="float-btn">
                    <img src={post?.status?.dislike_status === 'disliked' ? disliked : undisliked} />
                </div>
                <div onClick={() => toggleBookmark()} className="float-btn">
                    <FaBookmark className={`icon-style ${postBookmarked ? 'filled' : 'hollow'}`} />
                </div>
                <div className="float-btn">
                    <FaShareAlt className={`icon-style`} />
                </div>
            </div>

            {/* Overlays */}
            {showLikesOverlay && (
                <UserListOverlay userList={post.likes} onClose={handleCloseLikesOverlay} title="Likes" />
            )}
            {showDislikesOverlay && (
                <UserListOverlay userList={post.dislikes} onClose={handleCloseLikesOverlay} title="Dislikes" />
            )}
        </div>



    ) : (
        <div>Loading...</div>
    )
};

export default TimelinePerPost;