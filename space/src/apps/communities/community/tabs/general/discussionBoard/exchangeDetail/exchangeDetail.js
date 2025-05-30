import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useApi from '../../../../../../../utils/useApi';
import './exchangeDetail.css';
import {
    FiArrowUp,
    FiArrowDown,
    FiMessageSquare,
    FiArrowLeft,
    FiExternalLink
} from 'react-icons/fi';
import { formatDateTime } from '../../../../../../../utils/formatDateTime';
import ProfilePicture from '../../../../../../../utils/profilePicture/getProfilePicture';
import RenderText from '../../../../../../../utils/autoCompleteInput/renderText';

const ExchangeDetail = ({ postId: propPostId, embedded = false, onClose }) => {
    const { exchangeId: routeId } = useParams();
    const postId = propPostId || routeId;

    const { callApi } = useApi();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await callApi(`community/exchanges/e/${postId}/`);
                setPost(res.data);
            } catch (err) {
                console.error('Failed to fetch post detail', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

    if (loading) return <div className="exchange-detail-loading">Loading...</div>;
    if (!post) return <div className="exchange-detail-error">Post not found.</div>;

    const dummyComments = [
        {
            id: 1,
            user: "@demo_user",
            time: "just now",
            text: "This is a comment with replies.",
            votes: 5,
            replies: [
                {
                    id: 2,
                    user: "@nested_user",
                    time: "1 min ago",
                    text: "This is a nested reply.",
                    votes: 2,
                    replies: [
                        {
                            id: 3,
                            user: "@deep_reply",
                            time: "just now",
                            text: "Deep nesting works!",
                            votes: 1,
                            replies: []
                        }
                    ]
                }
            ]
        },
        {
            id: 4,
            user: "@another_user",
            time: "just now",
            text: "Another top-level comment.",
            votes: 3,
            replies: []
        }
    ];

    return (
        <div className={`exchange-detail-wrapper ${embedded ? 'embedded' : 'non-embedded'}`}>
            {embedded && (
                <>
                    <div className="exchange-top-buttons">
                        <button className="icon-btn" onClick={onClose}><FiArrowLeft /></button>
                        <Link to={`/communities/e/${postId}`} className="icon-btn"><FiExternalLink /></Link>
                    </div>
                    <div className="exchange-title-bar">
                        <RenderText text={post?.title} />
                    </div>
                </>
            )}

            <div className="exchange-detail-content-area">
                <div className="exchange-detail-main">
                    {!embedded && (
                        <div className="exchange-header-nonembedded-modern">
                            <div className="exchange-header-top">
                                <div className="exchange-post-title">
                                    <RenderText text={post?.title} />
                                </div>
                            </div>
                            <div className="exchange-post-meta-row">
                                <div className="exchange-post-meta">
                                    <span>Posted by @{post?.author?.username}</span>
                                    <span className="dot">•</span>
                                    <span>{formatDateTime(post.created_at)}</span>
                                </div>
                                <Link to={`/communities/${post?.community?.slug}`} className="exchange-meta-community-link">
                                    c/community-1{post?.community?.name}
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="community-card exchange-post-card">
                        <div className="vote-bar">
                            <FiArrowUp className="vote-icon" />
                            <span>{post.upvotes}</span>
                            <FiArrowDown className="vote-icon" />
                        </div>

                        <div className="post-body-section">
                            <div className="post-header">
                                <ProfilePicture src={post.author.profile_image} />
                                <div className="meta">
                                    <span className="username">@{post.author.username}</span>
                                    <span className="timestamp">{formatDateTime(post.created_at, true)}</span>
                                </div>
                            </div>

                            <div className="post-body">
                                <RenderText text={post.content} />
                            </div>

                            <div className="post-footer">
                                <FiMessageSquare />
                                <span>{post.comments_count} comments</span>
                            </div>
                        </div>
                    </div>

                    <div className="comments-section">
                        <h3>Comments</h3>
                        <div className="comment-thread-root">
                            {dummyComments.map(comment => (
                                <Comment key={comment.id} comment={comment} level={0} />
                            ))}
                        </div>
                    </div>
                </div>

                {!embedded && (
                    <div className="exchange-detail-sidebar-wrapper">
                        <div className="community-card exchange-detail-sidebar">
                            <div className="exchange-sidebar-section">
                                <h4>Quick Actions</h4>
                                <div className="sidebar-button-group">
                                    <button className="sidebar-button">Follow @{post.author.username}</button>
                                    <button className="sidebar-button">Send Message</button>
                                    <button className="sidebar-button">Save Post</button>
                                </div>
                            </div>

                            <div className="exchange-sidebar-section">
                                <h4>Explore More</h4>
                                <ul className="sidebar-links">
                                    <li><Link to="#">Related Discussion</Link></li>
                                    <li><Link to="#">Hot Threads</Link></li>
                                    <li><Link to="#">New This Week</Link></li>
                                </ul>
                            </div>

                            <div className="exchange-sidebar-section">
                                <h4>Community</h4>
                                <p>Respectful dialogue. Stay on topic. Contribute meaningfully.</p>
                                <button className="sidebar-button join-btn">Join Community</button>
                            </div>
                        </div>

                    </div>
                )}
            </div>

        </div>
    );
};

const Comment = ({ comment, level = 0 }) => {
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
        <div className="comment-thread-level" data-level={level}>
            <div className="comment-wrapper">
                <div className="comment-connector" />
                <div className="comment-content">
                    <div className="comment-header">
                        <ProfilePicture />
                        <span className="comment-username">{comment.user}</span>
                        <span className="comment-time">{comment.time}</span>
                    </div>
                    <div className="comment-body">
                        <div className="comment-text">{comment.text}</div>
                        <div className="comment-actions">
                            <div className="comment-vote">
                                <FiArrowUp className="vote-icon" />
                                <span>{comment.votes}</span>
                                <FiArrowDown className="vote-icon" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {hasReplies && (
                <div className="comment-children">
                    {comment.replies.map(reply => (
                        <Comment key={reply.id} comment={reply} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExchangeDetail;