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
import { FaBookmark, FaChevronLeft, FaChevronRight, FaEllipsisH, FaPaperPlane } from 'react-icons/fa';
import RenderText from '../../../../utils/autoCompleteInput/renderText';
import DropdownButton from '../../../../utils/popperButton/DropdownButton';

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
    } = useExpandPostContext();


    const handlePostClick = (index, post_type) => {
        let filteredPosts = posts;
    
        if (post_type === 'Visual') {
            filteredPosts = posts.filter(p => p.post_type === 'Visual');
        }
    
        handleExpandPostOpen(postId, filteredPosts, window.location.pathname + window.location.hash, index, post_type);
    };
    

    // console.log('TimelinePerPost post:', post);

    return post ? (
        <div className='timeline-per-post'>
            <div
                className='timeline-per-post-inner'>
                <div className='timeline-post-user-info'>
                    <div className='timeline-post-user-profile-picture'>
                        <ProfilePicture src={post?.author?.profile_image} />
                    </div>
                    <div className='timeline-post-user-username'>
                        <Link to={`profile/${post?.author?.username}`}>
                            {post?.author?.username}
                        </Link>
                    </div>
                    <div className='timeline-post-stats'>
                        <div className='timeline-post-created-at'>
                            <p>Posted {timeAgo(post?.meta?.created_at)}</p>
                        </div>
                        <div className='timeline-post-stats-count'>
                            <p onClick={() => handlePostClick(index, post.post_type)}>{post?.comments.length} {post?.comments?.length === 1 ? 'comment' : 'comments'}</p>
                            <p onClick={() => setShowLikesOverlay(!showLikesOverlay)}>{post?.stats?.likes_count} {post?.stats?.likes_count === 1 ? 'like' : 'likes'}</p>
                            <p onClick={() => setShowDislikesOverlay(!showDislikesOverlay)}>{post?.stats?.dislikes_count} {post?.stats?.dislikes_count === 1 ? 'dislike' : 'dislikes'}</p>
                        </div>
                    </div>
                </div>
                {post?.post_type === 'Visual' && (activeFilter === 'Visual' || activeFilter === 'All') &&
                    <>
                        <div className='timeline-post-media-container'>
                            {renderMediaContent(post?.post?.media_files[currentMediaIndex])}
                            <div className='timeline-post-previous-next-post-button-container'>
                                {currentMediaIndex > 0 ? (
                                    <button className='timeline-post-previous-post-button-container-inner' onClick={() => navigateMedia('prev')}>
                                        <FaChevronLeft className='icon-style' />
                                    </button>
                                ) : (
                                    <div className='timeline-btn-placeholder' />
                                )
                                }
                                {currentMediaIndex <= post?.post?.media_files?.length - 2 ? (
                                    <button className='timeline-post-next-post-button-container-inner' onClick={() => navigateMedia('next')}>
                                        <FaChevronRight className='icon-style' />
                                    </button>
                                ) : (
                                    <div className='timeline-btn-placeholder' />
                                )
                                }
                            </div>
                        </div>
                        <div className='timeline-post-comments-caption'>
                            <div className='timeline-caption'>
                                <Link to={`/profile/${post?.author?.username}`} className='username'>
                                    {post?.author?.username}
                                </Link>
                                <div className='caption-container'>
                                    <div className='caption-text'>
                                        <RenderText text={post?.post?.caption} />
                                        {/* <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post?.post?.caption) }} /> */}
                                    </div>
                                </div>
                            </div>
                            {post?.comments.length > 0 &&
                                <div className='timeline-view-comment-btn' onClick={() => handlePostClick(index, post.post_type)}>
                                    <p>View {post?.comments.length} Comments</p>
                                </div>
                            }
                            <div className='timeline-add-comment'>
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
                    </>}

                {post?.post_type === 'Thread' && (activeFilter === 'Thread' || activeFilter === 'All') &&
                    <div className='timeline-post-thread'>
                        <div className='timeline-thread-content'>
                            <RenderText text={post?.post?.content} />
                        </div>
                        <div className='timeline-thread-detail-interaction'>
                            <button className='timeline-post-detail-interaction-btn'>
                                <FontAwesomeIcon icon={faArrowUp} className="icon-style" />
                            </button>
                            <button className='timeline-post-detail-interaction-btn'>
                                <FontAwesomeIcon icon={faArrowDown} className="icon-style" />
                            </button>
                            <button className='timeline-post-detail-interaction-btn'>
                                <FontAwesomeIcon icon={faHeart} className="icon-style" />
                            </button>
                            <button className='timeline-post-detail-interaction-btn'>
                                <FontAwesomeIcon icon={faShareAlt} className="icon-style" />
                            </button>
                            <button className='timeline-post-detail-interaction-btn'>
                                <FontAwesomeIcon icon={faReply} className="icon-style" />
                            </button>
                            <DropdownButton
                                toggleContent={
                                    <button className='timeline-post-detail-interaction-btn'>
                                        <FontAwesomeIcon icon={faEllipsisV} className="icon-style" />
                                    </button>
                                }
                            >
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="quanta-packet-more-card"
                                >
                                    <ul>
                                        <li>Option 1</li>
                                        <li>Option 2</li>
                                        <li>Option 3</li>
                                    </ul>
                                </div>
                            </DropdownButton>
                        </div>
                    </div>
                }
            </div>
            <div className='timeline-per-post-interaction'>
                <div onClick={() => toggleLikeDislike('like')}>
                    <img src={post?.status?.like_status === 'liked' ? liked : unliked} />
                </div>
                <div onClick={() => toggleLikeDislike('dislike')}>
                    <img src={post?.status?.dislike_status === 'disliked' ? disliked : undisliked} />
                </div>
                <div onClick={() => toggleBookmark()}>
                    <FaBookmark
                        className={`icon-style ${postBookmarked ? 'filled' : 'hollow'}`}
                    />
                </div>
                <div onClick={() => handlePostClick(index, post.post_type)} id='more-button'>
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