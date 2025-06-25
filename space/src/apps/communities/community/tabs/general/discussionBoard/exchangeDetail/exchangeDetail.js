// ExchangeDetail.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FiArrowUp,
    FiArrowDown,
    FiMessageSquare,
    FiArrowLeft,
    FiExternalLink
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { EXCHANGE_DETAIL } from '../../../../../../../services/queryKeys';
import { fetchExchangeDetail } from '../../../../../../../services/communities';
import ProfilePicture from '../../../../../../../utils/profilePicture/getProfilePicture';
import RenderText from '../../../../../../../utils/autoCompleteInput/renderText';
import { formatDateTime } from '../../../../../../../utils/formatDateTime';
import './exchangeDetail.css';

export default function ExchangeDetail({ postId: propPostId, embedded = false, onClose }) {
    const { exchangeId: routeId } = useParams();
    const postId = propPostId || routeId;

    const { data: post, isLoading, isError } = useQuery({
        queryKey: EXCHANGE_DETAIL(postId),
        queryFn: () => fetchExchangeDetail(postId),
        enabled: !!postId,
    });

    const dummyComments = [
        {
            id: 1, user: "@demo_user", time: "just now", text: "This is a comment with replies.", votes: 5, replies: [
                {
                    id: 2, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [
                        { id: 3, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] }
                    ]
                }
            ]
        },
        { id: 4, user: "@another_user", time: "just now", text: "Another top-level comment.", votes: 3, replies: [] }
    ];

    if (isLoading) return <div className="ed-loading">Loading...</div>;
    if (isError || !post) return <div className="ed-error">Post not found.</div>;

    return (
        <div className={`ed-wrapper ${embedded ? 'ed-embedded' : 'ed-nonembedded'}`}>

            {/* embedded topbar + embedded header */}
            {embedded && (
                <>
                    <div className="ed-topbar">
                        <button className="ed-iconbtn" onClick={onClose}><FiArrowLeft /></button>
                        <Link to={`/communities/e/${postId}`} className="ed-iconbtn"><FiExternalLink /></Link>
                    </div>
                    <div className="ed-embedded-header">
                        <h1 className="ed-title"><RenderText text={post.title} /></h1>
                        <div className="ed-meta">
                            <span><RenderText text={`u/${post.author.username}`} /></span>
                            <span className="ed-dot">•</span>
                            <span>{formatDateTime(post.created_at)}</span>
                            <div className="ed-community-chip" >
                                <RenderText text={`c/${post.community.slug}`} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="ed-content">
                <div className="ed-main">
                    {/* non-embedded header */}
                    {!embedded && (
                        <header className="ed-header">
                            <h1 className="ed-title"><RenderText text={post.title} /></h1>
                            <div className="ed-meta">
                                <ProfilePicture src={post.author.profile_image} className="ed-header-avatar" />
                                <span><RenderText text={`u/${post.author.username}`} /></span>
                                <span className="ed-dot">•</span>
                                <span>{formatDateTime(post.created_at)}</span>
                                <div className="ed-community-chip" >
                                    <RenderText text={`c/${post.community.slug}`} />
                                </div>
                            </div>
                        </header>
                    )}

                    {/* post card */}
                    <article className="ed-postcard">
                        <div className="ed-votebar">
                            <div className='ed-votebar-inner' onClick={(e) => e.stopPropagation()}>
                            <FiArrowUp className="ed-voteicon" />
                            <span>{post.upvotes}</span>
                            <FiArrowDown className="ed-voteicon" />
                            </div>
    
                        </div>
                        <div className="ed-postbody">
                            <div className="ed-contentbody">
                                <RenderText text={post.content} />
                            </div>
                            <footer className="ed-postfooter">
                                <FiMessageSquare /><span>{post.comments_count} comments</span>
                            </footer>
                        </div>
                    </article>

                    {/* comments */}
                    <section className="ed-comments">
                        <h2>Replies</h2>
                        {dummyComments.map(c => <Comment key={c.id} comment={c} level={0} />)}
                    </section>
                </div>

                {/* non-embedded sidebar */}
                {!embedded && (
                    <aside className="ed-sidebar">
                        <div className="ed-sb-section">
                            <h3>Quick Actions</h3>
                            <button className="ed-sb-btn">Follow @{post.author.username}</button>
                            <button className="ed-sb-btn">Send Message</button>
                            <button className="ed-sb-btn">Save Post</button>
                        </div>
                        <div className="ed-sb-section">
                            <h3>Explore More</h3>
                            <ul className="ed-sb-links">
                                <li><Link to="#">Related Discussion</Link></li>
                                <li><Link to="#">Hot Threads</Link></li>
                                <li><Link to="#">New This Week</Link></li>
                            </ul>
                        </div>
                        <div className="ed-sb-section">
                            <h3>Community</h3>
                            <p>Respectful dialogue. Stay on topic. Contribute meaningfully.</p>
                            <button className="ed-sb-btn ed-join-btn">Join Community</button>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

function Comment({ comment, level }) {
    return (
        <div className="ed-comment-level" style={{ marginLeft: `${level * 1.5}rem` }}>
            <div className="ed-comment-box">
                <div className="ed-comment-header">
                    <ProfilePicture />
                    <span className="ed-comment-user">{comment.user}</span>
                    <span className="ed-comment-time">{comment.time}</span>
                </div>
                <div className="ed-comment-text">{comment.text}</div>
                <div className="ed-comment-actions">
                    <FiArrowUp className="ed-comment-voteicon" /><span>{comment.votes}</span>
                    <FiArrowDown className="ed-comment-voteicon" />
                </div>
            </div>
            {comment.replies.map(r => <Comment key={r.id} comment={r} level={level + 1} />)}
        </div>
    );
}
