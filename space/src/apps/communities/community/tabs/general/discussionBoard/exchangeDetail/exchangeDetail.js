// ExchangeDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FiArrowUp,
    FiArrowDown,
    FiMessageSquare,
    FiArrowLeft,
    FiExternalLink
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { ArcherContainer, ArcherElement } from 'react-archer';
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

    // ── Dummy data for demonstration; swap for `post.comments` in production ──
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
            replies: [
                {
                    id: 8,
                    user: "@nested_user",
                    time: "1 min ago",
                    text: "Nested under 4.",
                    votes: 2,
                    replies: [
                        {
                            id: 9,
                            user: "@deep_reply",
                            time: "just now",
                            text: "Deeper!",
                            votes: 1,
                            replies: [
                                {
                                    id: 10,
                                    user: "@too_deep",
                                    time: "1 min ago",
                                    text: "Too deep reply",
                                    votes: 2,
                                    replies: [
                                        {
                                            id: 11,
                                            user: "@deepest",
                                            time: "just now",
                                            text: "Deepest!",
                                            votes: 1,
                                            replies: []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        { id: 5, user: "@another_user", time: "just now", text: "Yet another comment.", votes: 3, replies: [] },
        { id: 6, user: "@another_user", time: "just now", text: "And one more.", votes: 3, replies: [] },
        { id: 7, user: "@another_user", time: "just now", text: "Last top-level.", votes: 3, replies: [] },
    ];
    // ────────────────────────────────────────────────────────────────────────

    const archerRef = useRef(null);
    useEffect(() => {
        if (archerRef.current) archerRef.current.refreshScreen();
    });

    if (isLoading) return <div className="ed-loading">Loading...</div>;
    if (isError || !post) return <div className="ed-error">Post not found.</div>;

    return (
        <div className={`ed-wrapper ${embedded ? 'ed-embedded' : 'ed-nonembedded'}`}>
            {embedded && (
                <div className="ed-topbar">
                    <button className="ed-iconbtn" onClick={onClose}><FiArrowLeft /></button>
                    <Link to={`/communities/e/${postId}`} className="ed-iconbtn"><FiExternalLink /></Link>
                </div>
            )}

            <div className="ed-content">
                <div className="ed-main">
                    {!embedded && (
                        <header className="ed-header">
                            <h1 className="ed-title"><RenderText text={post.title} /></h1>
                            <div className="ed-meta">
                                <ProfilePicture src={post.author.profile_image} className="ed-header-avatar" />
                                <span><RenderText text={`u/${post.author.username}`} /></span>
                                <span className="ed-dot">•</span>
                                <span>{formatDateTime(post.created_at)}</span>
                                <div className="ed-community-chip">
                                    <RenderText text={`c/${post.community.slug}`} />
                                </div>
                            </div>
                        </header>
                    )}

                    <article className="ed-postcard">
                        <div className="ed-votebar">
                            <div className="ed-votebar-inner" onClick={e => e.stopPropagation()}>
                                <FiArrowUp className="ed-voteicon" /><span>{post.upvotes}</span><FiArrowDown className="ed-voteicon" />
                            </div>
                        </div>
                        <div className="ed-postbody">
                            <div className="ed-contentbody"><RenderText text={post.content} /></div>
                            <footer className="ed-postfooter">
                                <FiMessageSquare /> <span>{post.comments_count} comments</span>
                            </footer>
                        </div>
                    </article>

<section className="ed-comments">
        <h2>Replies</h2>
        <ArcherContainer
  ref={archerRef}
  strokeColor="var(--ed-line)"
  strokeWidth={2}
  arrowLength={20}
  arrowThickness={2}
  startMarker={false}
endMarker={false}
lineStyle="curve"
offset={0} 
style={{ position: 'relative' }}
svgContainerStyle={{
position: 'absolute',
top: 0, left: 0,
width: '100%', height: '100%',
overflow: 'visible',
pointerEvents: 'none',
zIndex: 2
}}

        >
          <div className="ed-comments-tree">
            {dummyComments.map(c => (
              <Comment key={c.id} comment={c} level={0} />
            ))}
          </div>
        </ArcherContainer>
      </section>
                </div>

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




const INDENT_REM = 1.5;  // adjust to match your CSS

function Comment({ comment, level }) {
  const [expanded, setExpanded] = useState(false);
  const hasReplies   = comment.replies.length > 0;
  const truncated    = level >= 2 && !expanded && hasReplies;

  // anchor IDs
  const startId = `c${comment.id}-start`;
  const endId   = `c${comment.id}-end`;

  return (
    <div className="ed-comment-level" style={{ marginLeft: `${level * INDENT_REM}rem` }}>
      {/* wrap the box in nothing special—anchors live _inside_ it */}
      <div className="ed-comment-box">
        {/* 1) receive incoming arrows here */}
        <ArcherElement id={endId}>
          <div className="corner-anchor end" />
        </ArcherElement>

        {/* comment content */}
        <div className="ed-comment-header">
          <ProfilePicture/>
          <span className="ed-comment-user">{comment.user}</span>
          <span className="ed-comment-time">{comment.time}</span>
        </div>
        <div className="ed-comment-text">{comment.text}</div>
        <div className="ed-comment-actions">
          <FiArrowUp className="ed-comment-voteicon"/><span>{comment.votes}</span><FiArrowDown className="ed-comment-voteicon"/>
        </div>

        {/* 2) kick off outgoing arrows from here */}
        <ArcherElement
          id={startId}
  relations={comment.replies.map(r => ({
    targetId: `c${r.id}-end`,
    sourceAnchor: 'bottom',
    targetAnchor: 'left',
  }))}
        >
          <div className="corner-anchor start" />
        </ArcherElement>
      </div>

      {truncated
        ? (
          <button className="ed-view-replies-btn" onClick={() => setExpanded(true)}>
            View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
        )
        : comment.replies.map(r => (
            <Comment key={r.id} comment={r} level={level + 1}/>
          ))
      }
    </div>
  );
}