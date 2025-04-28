import React, { useEffect, useState } from 'react';
import './threadPost.css';
import useApi from '../../../utils/useApi';
import { useExpandPostContext } from '../expandPost/expandPostContext';
import RenderText from '../../../utils/autoCompleteInput/renderText';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { FaHeart, FaCommentDots, FaRetweet, FaBookmark, FaShareAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/formatDateTime';

const ThreadPost = () => {
    const { post } = useExpandPostContext();
    const { callApi } = useApi();
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        if (post) {
            console.log('ThreadPost component loaded', post);
        }
    }, [post]);

    const handleReplySubmit = () => {
        if (!replyText.trim()) return;
        console.log('Reply submitted:', replyText);
        setReplyText('');
        // later: call API to submit comment
    };

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
                        <button className="vote-btn">
                            <FaArrowUp className="icon-style" />
                        </button>
                        <div className="vote-count">
                            {post?.stats?.votes_count || 0}
                        </div>
                        <button className="vote-btn">
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
                        <div className="thread-post-reply">
                            <input
                                type="text"
                                placeholder="Write your reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button onClick={handleReplySubmit}>Reply</button>
                        </div>
                    </div>
                </div>

                {/* Comments List */}
                <div className="thread-post-comments">
                    {/* Later: Map real comments */}
                    <p className="comments-heading">Comments</p>
                    {/* Fake placeholder comments for now */}
                    <div className="comment-item">
                        <p><strong>@user123</strong> This is a cool thread!</p>
                    </div>
                    <div className="comment-item">
                        <p><strong>@someone</strong> Awesome work!</p>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div className="loading-thread-post">Loading...</div>
    );
};

export default ThreadPost;
