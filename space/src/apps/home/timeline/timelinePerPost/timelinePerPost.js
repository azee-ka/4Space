import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import './timelinePerPost.css';
import ProfilePicture from '../../../../utils/profilePicture/getProfilePicture';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import unliked from '../../../../assets/unliked.png';
import undisliked from '../../../../assets/undisliked.png';
import liked from '../../../../assets/liked.png';
import disliked from '../../../../assets/disliked.png';
import UserListOverlay from '../../../../components/userListOverlay/userListOverlay';
import { Link } from 'react-router';
import { timeAgo } from '../../../../utils/convertDateTIme';
import { usePostContext } from '../../../../context/PostContext';
import { useExpandPostContext } from '../../../../components/postUI/expandPost/expandPostContext';
import { FaBookmark, FaChevronLeft, FaChevronRight, FaEllipsisH, FaPaperPlane } from 'react-icons/fa';

const TimelinePerPost = ({ postId, posts, index }) => {
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
    } = useExpandPostContext();


    const handlePostClick = (index) => {
        handleExpandPostOpen(postId, posts, window.location.pathname + window.location.hash, index);
    };

    return post ? (
        <div className='radian-timeline-per-post'>
            <div 
                className='radian-timeline-per-post-inner'>
                <div className='radian-timeline-post-user-info'>
                    <div className='radian-timeline-post-user-profile-picture'>
                        <ProfilePicture src={post?.author?.profile_image} />
                    </div>
                    <div className='radian-timeline-post-user-username'>
                        <Link to={`profile/${post?.author?.username}`}>
                            {post?.author?.username}
                        </Link>
                    </div>
                    <div className='radian-timeline-post-stats'>
                        <div className='radian-timeline-post-created-at'>
                            <p>Posted {timeAgo(post?.created_at)}</p>
                        </div>
                        <div className='radian-timeline-post-stats-count'>
                            <p onClick={() => handlePostClick(index)}>{post?.comments.length} {post?.comments?.length === 1 ? 'comment' : 'comments'}</p>
                            <p onClick={() => setShowLikesOverlay(!showLikesOverlay)}>{post?.likes_count} {post?.likes_count === 1 ? 'like' : 'likes'}</p>
                            <p onClick={() => setShowDislikesOverlay(!showDislikesOverlay)}>{post?.dislikes_count} {post?.dislikes_count === 1 ? 'dislike' : 'dislikes'}</p>
                        </div>
                    </div>
                </div>
                <div className='radian-timeline-post-media-container'>
                    {renderMediaContent(post?.media_files[currentMediaIndex])}
                    <div className='radian-timeline-post-previous-next-post-button-container'>
                        {currentMediaIndex > 0 ? (
                            <button className='radian-timeline-post-previous-post-button-container-inner' onClick={() => navigateMedia('prev')}>
                                <FaChevronLeft className='icon-style' />
                            </button>
                        ) : (
                            <div className='radian-timeline-btn-placeholder' />
                        )
                        }
                        {currentMediaIndex <= post?.media_files?.length - 2 ? (
                            <button className='radian-timeline-post-next-post-button-container-inner' onClick={() => navigateMedia('next')}>
                                <FaChevronRight className='icon-style' />
                            </button>
                        ) : (
                            <div className='radian-timeline-btn-placeholder' />
                        )
                        }
                    </div>
                </div>
                <div className='radian-timeline-post-comments-caption'>
                    <div className='radian-timeline-caption'>
                        <Link to={`/profile/${post?.author?.username}`} className='username'>
                            {post?.author?.username}
                        </Link>
                        <div className='caption-container'>
                            <div className='caption-text'>
                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post?.text) }} />
                            </div>
                        </div>
                    </div>
                    {post?.comments.length > 0 &&
                        <div className='radian-timeline-view-comment-btn' onClick={() => handlePostClick(index)}>
                            <p>View {post?.comments.length} Comments</p>
                        </div>
                    }
                    <div className='radian-timeline-add-comment'>
                        <input
                            placeholder='Comment here...'
                            value={commentText}
                            onChange={(e) => setCommentText(e?.target?.value)}
                        />
                        <button onClick={() => addComment()}>
                            <FaPaperPlane className='icon-style' />
                        </button>
                    </div>
                </div>


            </div>
            <div className='radian-timeline-per-post-interaction'>
                <div onClick={() => toggleLikeDislike('like')}>
                    <img src={post.like_status === 'liked' ? liked : unliked} />
                </div>
                <div onClick={() => toggleLikeDislike('dislike')}>
                    <img src={post.dislike_status === 'disliked' ? disliked : undisliked} />
                </div>
                <div onClick={() => toggleBookmark()}>
                    <FaBookmark
                        className={`icon-style ${postBookmarked ? 'filled' : 'hollow'}`}
                    />
                </div>
                <div onClick={() => handlePostClick(index)} id='more-button'>
                    <FaEllipsisH
                        className={`icon-style`}
                    />
                </div>
            </div>
            {showLikesOverlay && (
                <UserListOverlay userList={post.likes} onClose={handleCloseLikesOverlay} title={'Likes'} />
            )}
            {showDislikesOverlay && (
                <UserListOverlay userList={post.dislikes} onClose={handleCloseLikesOverlay} title={'Dislikes'} />
            )}
        </div>
    ) : (
        <div>Loading...</div>
    )
};

export default TimelinePerPost;