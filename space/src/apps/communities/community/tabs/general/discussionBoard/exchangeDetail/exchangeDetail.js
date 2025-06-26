// ExchangeDetail.jsx
import React, { useState, useRef, useLayoutEffect } from 'react';
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

const INDENT_REM = 1; // rem per nesting level
const ELBOW_RADIUS = 8; // px


export default function ExchangeDetail({ postId: propPostId, embedded = false, onClose }) {
  const { exchangeId: routeId } = useParams();
  const postId = propPostId || routeId;
  const { data: post, isLoading, isError } = useQuery({
    queryKey: EXCHANGE_DETAIL(postId),
    queryFn: () => fetchExchangeDetail(postId),
    enabled: !!postId,
  });

  // ── Dummy data ──
  const dummyComments = [
    {
      id: 1, user: "@demo_user", time: "just now", text: "This is a comment with replies.", votes: 5, replies: [
        {
          id: 2, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [
            {
              id: 23, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [
                { id: 30, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                { id: 31, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                { id: 32, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                { id: 33, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                { id: 34, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                {
                  id: 35, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [
                    { id: 36, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                    { id: 37, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                    {
                      id: 38, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [
                        { id: 43, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                      ]
                    },
                    { id: 39, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                    { id: 40, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                    { id: 41, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                    { id: 42, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
                  ]
                },
              ]
            },
            { id: 24, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
            { id: 25, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
            { id: 26, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
            { id: 27, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
            { id: 28, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
            { id: 29, user: "@deep_reply", time: "just now", text: "Deep nesting works!", votes: 1, replies: [] },
          ]
        },
        { id: 12, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 13, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 14, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 15, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 16, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 17, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 18, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 19, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 20, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 21, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
        { id: 22, user: "@nested_user", time: "1 min ago", text: "This is a nested reply.", votes: 2, replies: [] },
      ]
    },
    {
      id: 4, user: "@another_user", time: "just now", text: "Another top-level comment.", votes: 3, replies: [
        {
          id: 8, user: "@nested_user", time: "1 min ago", text: "Nested under 4.", votes: 2, replies: [
            {
              id: 9, user: "@deep_reply", time: "just now", text: "Deeper!", votes: 1, replies: [
                {
                  id: 10, user: "@too_deep", time: "1 min ago", text: "Too deep reply", votes: 2, replies: [
                    { id: 11, user: "@deepest", time: "just now", text: "Deepest!", votes: 1, replies: [] }
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

  // refs to every comment box and parent relationships
  const boxRefs   = useRef({});  // { [id]: React.RefObject }
  const parentMap = useRef({});  // { [id]: parentId or null }

  // build connector lines after layout
  const treeRef = useRef(null);
  const [connectors, setConnectors] = useState([]);

  useLayoutEffect(() => {
    if (!treeRef.current) return;
    const treeRect = treeRef.current.getBoundingClientRect();
    const newConns = [];

    Object.entries(boxRefs.current).forEach(([id, ref]) => {
      const parentId = parentMap.current[id];
      if (parentId == null) return;
      const parentRef = boxRefs.current[parentId];
      if (!ref.current || !parentRef.current) return;

      const pRect = parentRef.current.getBoundingClientRect();
      const cRect = ref.current.getBoundingClientRect();

      const x1 = pRect.left   - treeRect.left + 1;
      const y1 = pRect.bottom - treeRect.top;
      const x2 = cRect.left   - treeRect.left + 1;
      const y2 = cRect.top    - treeRect.top;

      newConns.push({ x1, y1, x2, y2 });
    });

    // only update state if connectors actually changed
    const same =
      newConns.length === connectors.length &&
      newConns.every((c, i) =>
        c.x1 === connectors[i].x1 &&
        c.y1 === connectors[i].y1 &&
        c.x2 === connectors[i].x2 &&
        c.y2 === connectors[i].y2
      );
    if (!same) {
      setConnectors(newConns);
    }
  }, [connectors]);

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
          {/* HEADER */}
          <header className="ed-header">
            <h1 className="ed-title"><RenderText text={post.title} /></h1>
            <div className="ed-meta">
              <span><RenderText text={`u/${post.author.username}`} /></span>
              <span className="ed-dot">•</span>
              <span>{formatDateTime(post.created_at)}</span>
              <div className="ed-community-chip">
                <RenderText text={`c/${post.community.slug}`} />
              </div>
            </div>
          </header>

          {/* POST CARD */}
          <article className="ed-postcard">
            <div className="ed-votebar">
              <div className="ed-votebar-inner" onClick={e => e.stopPropagation()}>
                <FiArrowUp className="ed-voteicon" />
                <span>{post.upvotes}</span>
                <FiArrowDown className="ed-voteicon" />
              </div>
            </div>
            <div className="ed-postbody">
              <div className="ed-contentbody"><RenderText text={post.content} /></div>
              <footer className="ed-postfooter">
                <FiMessageSquare /> <span>{post.comments_count} comments</span>
              </footer>
            </div>
          </article>

          {/* COMMENTS TREE */}
          <section className="ed-comments">
            <h2>Replies</h2>
            <div className="ed-comments-tree" ref={treeRef} style={{ position: 'relative' }}>
              {dummyComments.map(c => (
                <Comment
                  key={c.id}
                  comment={c}
                  level={0}
                  parentId={null}
                  boxRefs={boxRefs}
                  parentMap={parentMap}
                />
              ))}
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
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
  const [expanded, setExpanded] = useState(false);
  const hasReplies = comment.replies.length > 0;
  const truncated  = level >= 2 && !expanded && hasReplies;
  const indentRem  = level * INDENT_REM;
  const repliesRef = useRef(null);
  const [spineHeight, setSpineHeight] = useState(0);

useLayoutEffect(() => {
  const container = repliesRef.current;
  if (!container) {
    setSpineHeight(0);
    return;
  }

  const containerRect = container.getBoundingClientRect();
  // grab only the immediate .ed-comment-level children
  const directLevels = Array.from(container.children)
    .filter(el => el.classList.contains('ed-comment-level'));

  if (directLevels.length === 0) {
    setSpineHeight(0);
    return;
  }

  // baseline: if no elbows found, at least draw down to ELBOW_RADIUS
  const minElbowY = containerRect.top + ELBOW_RADIUS;

  // for each sibling: find its elbow Y (box-top + ELBOW_RADIUS)
  const elbowYs = directLevels.map(level => {
    const box = level.querySelector('.ed-comment-box.ed-has-line');
    if (!box) return minElbowY;
    const { top } = box.getBoundingClientRect();
    return top + ELBOW_RADIUS;
  });

  // pick the furthest‐down elbow
  const maxElbowY = Math.max(...elbowYs, minElbowY);

  // convert into relative height inside this container
  // add 1px so the line actually reaches into the little curve
  const heightPx = Math.ceil(maxElbowY - containerRect.top) + 28;

  setSpineHeight(heightPx);
}, [expanded]);



  return (
    <div className="ed-comment-level">
      <div className={`ed-comment-box${level > 0 ? ' ed-has-line' : ''}`}>
        <div className="ed-comment-header">
          <ProfilePicture />
          <span className="ed-comment-user">{comment.user}</span>
          <span className="ed-comment-time">{comment.time}</span>
        </div>
        <div className="ed-comment-text">{comment.text}</div>
        <div className="ed-comment-actions">
          <FiArrowUp className="ed-comment-voteicon" />
          <span>{comment.votes}</span>
          <FiArrowDown className="ed-comment-voteicon" />
        </div>
      </div>

      {truncated ? (
        <button className="ed-view-replies-btn" onClick={() => setExpanded(true)}>
          View {comment.replies.length} replies
        </button>
      ) : hasReplies && (
        <div className="ed-replies" ref={repliesRef}>
          {/*
            Inline <svg> spine of exactly the right height:
            x=0 (left edge), y=ELBOW_RADIUS,
            height = spineHeight
          */}
          <svg
            className="connector-spine"
            width={ELBOW_RADIUS}
            height={spineHeight}
            style={{
            position: 'absolute',
            top: '-1.5rem',
            left: `-2rem`      /* shift right under the elbow */
          }}
          >
            <path
              d={`M ${ELBOW_RADIUS/2},${ELBOW_RADIUS} L ${ELBOW_RADIUS/2},${spineHeight}`}
              stroke="var(--ed-line)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          {comment.replies.map(r => (
            <Comment key={r.id} comment={r} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

