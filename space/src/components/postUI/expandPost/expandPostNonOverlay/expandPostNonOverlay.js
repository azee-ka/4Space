import React, { useState } from 'react';
import './expandPostNonOverlay.css';
import DOMPurify from 'dompurify';
import { useAuth } from '../../../../hooks/useAuth';
import { timeAgo } from '../../../../utils/convertDateTIme';
import ExpandedPostLoading from '../expandedPostLoading/expandedPostLoading';
import unliked from '../../../../assets/unliked.png';
import undisliked from '../../../../assets/undisliked.png';
import liked from '../../../../assets/liked.png';
import disliked from '../../../../assets/disliked.png';
import UserListOverlay from '../../../userListOverlay/userListOverlay';
import { Link } from 'react-router';
import ProfilePicture from '../../../../utils/profilePicture/getProfilePicture';
import { FaArrowDown, FaArrowUp, FaBookmark, FaChevronLeft, FaChevronRight, FaEllipsisH, FaHeart, FaPaperPlane, FaReply, FaTrash } from 'react-icons/fa';
import { useExpandPostContext } from '../expandPostContext';
import CustomEditor from '../../../../utils/editor/editor';
import EmojiButton from '../../../../utils/editor/EmojiButton';
import RenderText from '../../../../utils/autoCompleteInput/renderText';
import { usePostContext } from '../../../../context/PostContext';

const ExpandedPostNonOverlay = () => {
    const {
        post,
        postBookmarked,
        commentText,
        commentReplyText,
        showLikesOverlay,
        showDislikesOverlay,
        setCommentText,
        currentMediaIndex,
        setShowLikesOverlay,
        setShowDislikesOverlay,
        toggleLikeDislike,
        deletePost,
        toggleBookmark,
        addComment,
        voteComment,
        toggleCommentLike,
        replyToComment,
        navigateMedia,
        renderMediaContent,
        handleCloseLikesOverlay,
    } = useExpandPostContext();

    const { setShowPostMoreMenuOverlay } = usePostContext();
    const { authState } = useAuth();

    return post ? (
        <div className="expanded-post-container">
            <div className='expanded-post-user-info-comments-container'>
                <div className='expanded-post-comment-top-panel'>
                    <div className='expanded-post-user-info-container'>
                        <div className='expanded-post-user-info-profile-image'>
                            <ProfilePicture src={post?.author?.profile_image} />
                        </div>
                        <Link to={`/profile/${post?.author?.username}`} className='custom-link'>
                            {post?.author?.username}
                        </Link>
                    </div>
                    <div className='expanded-post-comment-top-panel-other-info'>

                    </div>
                </div>
                <div className='expanded-post-comments'>
                    {post?.text?.length > 0 &&
                        <div className='expanded-post-per-comment'>
                            <div className='expanded-post-comments-info'>
                                <div className='expanded-post-commenting-user-info'>
                                    <div className='expanded-post-commenting-user-profile-picture'>
                                        <div className='expanded-post-commenting-user-profile-picture-inner'>
                                            <ProfilePicture src={post?.author?.profile_image} />
                                        </div>
                                    </div>
                                    <div className='expanded-post-commenting-user-username'>
                                        <p>
                                            <Link to={`/profile/${post?.author?.username}`}>
                                                {post?.author?.username}
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                                <div className='expanded-post-comment-info'>
                                    <p>Posted {timeAgo(post?.created_at)}</p>
                                </div>
                            </div>
                            <div className='expanded-post-comments-text'>
                                <div className='expanded-post-comments-text-inner'>
                                    <RenderText text={post?.text} />
                                </div>
                            </div>
                        </div>
                    }
                    {post?.comments?.length !== 0 ?
                        (post.comments.map((commentData, index) => (
                            <div key={`${index}-${commentData.created_at}`} className='expanded-post-per-comment'>
                                <div className='expanded-post-comments-info'>
                                    <div className='expanded-post-commenting-user-info'>
                                        <div className='expanded-post-commenting-user-profile-picture'>
                                            <div className='expanded-post-commenting-user-profile-picture-inner'>
                                                <ProfilePicture src={commentData?.author?.profile_image} />
                                            </div>
                                        </div>
                                        <div className='expanded-post-commenting-user-username'>
                                            <p>
                                                <Link to={`/profile/${commentData?.author?.username}`}>
                                                    {commentData.author.username}
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                    <div className='expanded-post-comment-info'>
                                        <p>Posted {timeAgo(commentData.created_at)}</p>
                                    </div>
                                </div>
                                <div className='expanded-post-comments-text'>
                                    <div className='expanded-post-comments-text-inner'>
                                        <RenderText text={commentData?.text} />
                                    </div>
                                </div>
                                <div className='expanded-post-comment-interaction'>
                                    <div>
                                        <button
                                            onClick={() => toggleCommentLike(commentData.id)}
                                            className={`expanded-post-comment-interaction-btn ${commentData?.like_status === 'liked' ? 'liked' : ''}`}
                                        >
                                            <FaHeart />
                                        </button>
                                        <p>{commentData.likes_count}</p>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => voteComment(commentData.id, 'upvote')}
                                            className={`expanded-post-comment-interaction-btn ${commentData?.vote_status === 'upvoted' ? 'voted' : ''}`}
                                        >
                                            <FaArrowUp />
                                        </button>
                                        <p>{commentData.upvotes_count}</p>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => voteComment(commentData.id, 'downvote')}
                                            className={`expanded-post-comment-interaction-btn ${commentData?.vote_status === 'downvoted' ? 'voted' : ''}`}
                                        >
                                            <FaArrowDown />
                                        </button>
                                        <p>{commentData.downvotes_count}</p>
                                    </div>
                                    <div>
                                        <button className='expanded-post-comment-interaction-btn'>
                                            <FaReply />
                                        </button>
                                        <p>0</p>
                                    </div>
                                </div>
                            </div>
                        ))) : (
                            <div className='expanded-post-no-comments'>
                                No Comments
                            </div>
                        )
                    }
                </div>
                <div className='expanded-post-comment-post-container'>
                    <div className='expanded-post-comment-post-container-inner'>
                        <EmojiButton />
                        <CustomEditor
                            placeholder='Comment here...'
                            content={commentText}
                            onContentChange={setCommentText}
                            showToolbar={false}
                        />
                        {(commentText !== '' || commentText === "<p><br></p>") &&
                            <button 
                                onClick={() => addComment()}
                                className={`expanded-post-comment-post-button`}
                            >
                                <FaPaperPlane />
                            </button>
                        }
                    </div>
                </div>
            </div>
            <div className='expanded-post-info-img-container'>
                <div className='expanded-post-info-container'>
                    <div className='expanded-post-info-container-inner'>
                        <div className='expanded-post-creation-time'>
                            <p>Posted {timeAgo(post.created_at)}</p>
                        </div>
                        <div className='expanded-post-info-likes-unlikes-comments-count'>
                            <p>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</p>
                            <p onClick={() => setShowLikesOverlay(!showLikesOverlay)}>{post?.likes_count} {post?.likes_count === 1 ? 'like' : 'likes'}</p>
                            <p onClick={() => setShowDislikesOverlay(!showDislikesOverlay)}>{post?.dislikes_count} {post?.dislikes_count === 1 ? 'dislike' : 'dislikes'}</p>
                        </div>
                    </div>
                </div>
                <div className='expanded-post-media-container'>
                    <div className='expanded-post-media'>
                        {renderMediaContent()}
                    </div>
                    {post.media_files.length > 1 &&
                        <div className='expanded-post-img-previous-next-buttons-container'>
                            {currentMediaIndex > 0 ? (
                                <button className='expanded-post-img-previous-button-container-inner' onClick={() => navigateMedia('prev')}>
                                    <FaChevronLeft className='icon-style' />
                                </button>
                            ) : (
                                <div className='expand-post-btn-placeholder' />
                            )
                            }
                            {currentMediaIndex !== post?.media_files?.length - 1 ? (
                                <button className='expanded-post-img-next-button-container-inner' onClick={() => navigateMedia('next')}>
                                    <FaChevronRight className='icon-style' />
                                </button>
                            ) : (
                                <div className='expand-post-btn-placeholder' />
                            )
                            }
                        </div>
                    }
                </div>
            </div>
            <div className='expanded-post-interaction-container'>
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
                <div onClick={() => setShowPostMoreMenuOverlay(true)} >
                <FaEllipsisH className={`icon-style`} />
                </div>
                {post?.author?.username === authState?.author?.username &&
                    <div onClick={() => deletePost()} className='expanded-post-delete-post'>
                        <FaTrash className='icon-style' />
                    </div>
                }
            </div>
            {showLikesOverlay && (
                <UserListOverlay userList={post.likes} onClose={handleCloseLikesOverlay} title={'Likes'} username={authState.user.username} />
            )}
            {showDislikesOverlay && (
                <UserListOverlay userList={post.dislikes} onClose={handleCloseLikesOverlay} title={'Dislikes'} username={authState.user.username} />
            )}
        </div>
    ) : (
        <ExpandedPostLoading />
    );
}

export default ExpandedPostNonOverlay;