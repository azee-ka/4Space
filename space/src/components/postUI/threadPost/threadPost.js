import React, { useEffect, useRef, useState } from 'react';
import './threadPost.css';
import useApi from '../../../utils/useApi';
import { useExpandPostContext } from '../expandPost/expandPostContext';
import RenderText from '../../../utils/autoCompleteInput/renderText';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { FaHeart, FaCommentDots, FaRetweet, FaBookmark, FaShareAlt, FaArrowUp, FaArrowDown, FaReply } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/formatDateTime';
import CustomEditor from '../../../utils/editor/editor';
import EmojiButton from '../../../utils/editor/EmojiButton';
import CustomTextarea from '../../../pages/messages/chatContainer/customTextarea';

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
    } = useExpandPostContext();

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
                    <RenderText text={post?.post?.content} />
                </div>

                {/* Stats */}
                <div className="thread-post-stats">
                    <div><span>{post?.stats?.likes_count || 0}</span> Likes</div>
                    <div><span>{post?.stats?.comments_count || 0}</span> Comments</div>
                    <div><span>{post?.stats?.reposts_count || 0}</span> Reposts</div>
                    <div><span>{post?.stats?.views_count || 0}</span> Views</div>
                </div>

                {/* Voting + Content Box */}
                <div className="thread-post-main-interactions">
                    {/* Left side: Votes */}
                    <div className="vote-box">
                        <button className={`vote-btn ${post?.status?.vote_status === "upvoted" ? 'active' : ''}`} onClick={() => votePost('upvote')}>
                            <FaArrowUp className="icon-style" />
                        </button>
                        <div className="vote-count">
                            {post?.stats?.net_votes_count || 0}
                        </div>
                        <button className={`vote-btn ${post?.status?.vote_status === "downvoted" ? 'active' : ''}`} onClick={() => votePost('downvote')}>
                            <FaArrowDown className="icon-style" />
                        </button>
                    </div>


                    {/* Right side: Actions + Reply */}
                    <div className="action-and-reply-box">
                        <div className="thread-post-actions">
                            <button className="action-btn">
                                <FaHeart className="icon-style" /> Like
                            </button>
                            <button className="action-btn">
                                <FaCommentDots className="icon-style" /> Comment
                            </button>
                            <button className="action-btn">
                                <FaRetweet className="icon-style" /> Repost
                            </button>
                            <button className="action-btn">
                                <FaBookmark className="icon-style" /> Save
                            </button>
                            <button className="action-btn">
                                <FaShareAlt className="icon-style" /> Share
                            </button>
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
                    </div>
                </div>

                {/* Comments List */}
                {/* Comments List */}
                <div className="thread-post-comments">
                    <p className="comments-heading">Comments</p>

                    {post?.comments?.length > 0 ? (
                        post.comments.map((comment) => (
                            <div key={comment.id} className="comment-item">
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

                                {/* Interaction Row */}
                                <div className="comment-actions-row">
                                    <button className="comment-action-btn"><FaHeart /> Like</button>
                                    <button className="comment-action-btn"><FaReply /> Reply</button>
                                    <button className="comment-action-btn"><FaArrowUp /> Upvote</button>
                                    <button className="comment-action-btn"><FaArrowDown /> Downvote</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-comments">No comments yet. Be the first to reply!</div>
                    )}
                </div>
            </div>
        </div>
    ) : (
        <div className="loading-thread-post">Loading...</div>
    );
};

export default ThreadPost;
