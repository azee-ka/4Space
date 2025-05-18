import React, { useEffect, useState } from 'react';
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
import { Link } from 'react-router';
import { timeAgo } from '../../../../utils/convertDateTIme';
import { usePostContext } from '../../../../context/PostContext';
import { useExpandPostContext } from '../../../../components/postUI/expandPost/expandPostContext';
import { FaArrowDown, FaArrowUp, FaBan, FaBellSlash, FaBookmark, FaChevronLeft, FaChevronRight, FaCommentDots, FaEdit, FaEllipsisH, FaEllipsisV, FaExpandAlt, FaExpandArrowsAlt, FaFlag, FaHeart, FaMagic, FaPaperPlane, FaReply, FaRetweet, FaShareAlt, FaTrashAlt, FaVolumeMute } from 'react-icons/fa';
import RenderText from '../../../../utils/autoCompleteInput/renderText';
import DropdownButton from '../../../../utils/popperButton/DropdownButton';
import { formatDateTime } from '../../../../utils/formatDateTime';

const TimelinePerPost = ({ postId, posts, index, activeFilter }) => {
    const { handleExpandPostOpen } = usePostContext();

    const {
        post,
        postBookmarked,
        commentText,
        showLikesOverlay,
        showDislikesOverlay,
        currentMediaIndex,
        setCommentText,
        setShowLikesOverlay,
        setShowDislikesOverlay,
        toggleLikeDislike,
        toggleBookmark,
        addComment,
        navigateMedia,
        renderMediaContent,
        handleCloseLikesOverlay,
        isSelfPost,
        deletePost,
    } = useExpandPostContext();


    const handlePostClick = (index, post_type) => {
        let filteredPosts = posts;

        if (post_type === 'Visual') {
            filteredPosts = posts.filter(p => p.post_type === 'Visual');
        }

        handleExpandPostOpen(postId, filteredPosts, window.location.pathname + window.location.hash, index, post_type);
    };


    // console.log('TimelinePerPost post:', post);

    return post ? (<div className="timeline-per-post-wrapper">

        {/* Main Post Card */}
        <div className="timeline-per-post">
            <div className="timeline-post-user-info">
                <div className="timeline-post-user-details">
                    <div className="user-profile-wrapper">
                        <ProfilePicture src={post?.author?.profile_image} />
                    </div>
                    <div className="user-info-text">
                        <Link to={`/profile/${post?.author?.username}`}>@{post?.author?.username}</Link>
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
                        <strong>{post?.comments?.length || 0}</strong>
                        <span>Comments</span>
                    </div>
                </div>

            </div>

            {post?.post_type === 'Visual' && (activeFilter === 'Visual' || activeFilter === 'All') && (
                <div className="timeline-visual-post">
                    <div className="media-container">
                        {renderMediaContent(post?.post?.media_files[currentMediaIndex])}
                        <div className="media-nav-buttons">
                            {currentMediaIndex < (post?.post?.media_files?.length || 0) - 1 && (
                                <div></div>
                            )}
                            {currentMediaIndex > 0 && (
                                <button onClick={() => navigateMedia('prev')}><FaChevronLeft /></button>
                            )}
                            {currentMediaIndex < (post?.post?.media_files?.length || 0) - 1 && (
                                <button onClick={() => navigateMedia('next')}><FaChevronRight /></button>
                            )}
                            {currentMediaIndex > 0 && (
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
                        <div className="thread-content">
                            <RenderText text={post?.post?.content} />
                        </div>

                        <div className="thread-vote-buttons">
                            <button className="vote-btn"><FaArrowUp /></button>
                            <div className="vote-count">
                            {post?.stats?.votes_count || 0}
                        </div>
                            <button className="vote-btn"><FaArrowDown /></button>
                        </div>
                    </div>

                    <div className="thread-actions-row">
                        <button className="thread-action-btn"><FaReply className="icon-style" /> Reply</button>
                        <button className="thread-action-btn"><FaRetweet className="icon-style" /> Repost</button>
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