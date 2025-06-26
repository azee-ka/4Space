// src/apps/communities/community/tabs/general/discussionBoard/exchangeDetail/exchangeDetail.jsx
import React, { useState, useRef, useLayoutEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FiArrowUp,
    FiArrowDown,
    FiMessageSquare,
    FiArrowLeft,
    FiExternalLink
} from 'react-icons/fi';
import {
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient
} from '@tanstack/react-query';
import { EXCHANGE_DETAIL } from '../../../../../../../services/queryKeys';
import {
    fetchExchangeDetail,
    fetchComments,
    fetchReplies,
    createComment
} from '../../../../../../../services/communities';
import RenderText from '../../../../../../../utils/autoCompleteInput/renderText';
import { formatDateTime } from '../../../../../../../utils/formatDateTime';
import CustomEditor from '../../../../../../../utils/editor/editor';
import EmojiButton from '../../../../../../../utils/editor/EmojiButton';
import './exchangeDetail.css';

const ELBOW_RADIUS = 8;

export default function ExchangeDetail({ postId: propPostId, embedded = false, onClose }) {
    const { exchangeId: routeId } = useParams();
    const postId = propPostId || routeId;
    const qc = useQueryClient();

    // 1) Fetch post
    const { data: post, isLoading: postLoading, isError: postError } = useQuery({
        queryKey: EXCHANGE_DETAIL(postId),
        queryFn: () => fetchExchangeDetail(postId),
        enabled: !!postId
    });

    // 2) Fetch top-level comments
    const {
        data: commentsPages,
        isLoading: commentsLoading,
        fetchNextPage,
        hasNextPage
    } = useInfiniteQuery({
        queryKey: ['comments', postId],
        queryFn: ({ pageParam = 1 }) => fetchComments({ postId, pageParam }),
        getNextPageParam: last => last.next
            ? Number(new URL(last.next).searchParams.get('page'))
            : undefined,
        enabled: !!postId
    });

    // 3) Mutation for posting replies
    const replyMutation = useMutation({
        mutationFn: ({ content, parentId }) => createComment({ postId, content, parent: parentId }),
        onSuccess: () => qc.invalidateQueries(['comments', postId])
    });

    // 4) Connector SVG state & refs
    const boxRefs = useRef({});
    const parentMap = useRef({});
    const treeRef = useRef(null);
    const [connectors, setConnectors] = useState([]);

    // 5) Top-level reply UI
    const [showPostReply, setShowPostReply] = useState(false);
    const [postReplyContent, setPostReplyContent] = useState('');

    // rebuild connector lines
    useLayoutEffect(() => {
        if (!treeRef.current || !commentsPages) return;
        const treeRect = treeRef.current.getBoundingClientRect();
        const newConns = [];

        Object.entries(boxRefs.current).forEach(([id, ref]) => {
            const pid = parentMap.current[id];
            const pRef = boxRefs.current[pid];
            if (!pid || !ref.current || !pRef?.current) return;
            const pRect = pRef.current.getBoundingClientRect();
            const cRect = ref.current.getBoundingClientRect();
            newConns.push({
                x1: pRect.left - treeRect.left + 1,
                y1: pRect.bottom - treeRect.top,
                x2: cRect.left - treeRect.left + 1,
                y2: cRect.top - treeRect.top
            });
        });

        const same = newConns.length === connectors.length &&
            newConns.every((c, i) =>
                c.x1 === connectors[i].x1 &&
                c.y1 === connectors[i].y1 &&
                c.x2 === connectors[i].x2 &&
                c.y2 === connectors[i].y2
            );
        if (!same) setConnectors(newConns);
    }, [commentsPages, connectors]);

    // early returns
    if (postLoading) return <div className="ed-loading">Loading post…</div>;
    if (postError || !post) return <div className="ed-error">Post not found.</div>;

    const allComments = commentsPages?.pages.flatMap(p => p.results) || [];

    // handle top-level reply submit
    const submitPostReply = () => {
        replyMutation.mutate({ content: postReplyContent, parentId: null });
        setPostReplyContent('');
        setShowPostReply(false);
    };

    // common onReply callback
    const onReply = (content, parentId) => {
        replyMutation.mutate({ content, parentId });
    };

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
                            <div className="ed-community-chip"><RenderText text={`c/${post.community.slug}`} /></div>
                        </div>
                    </header>

                    {/* POST CARD */}
                    <article className="ed-postcard ed-postcard-style">
                        <div className="ed-votebar">
                            <div className="ed-votebar-inner" onClick={e => e.stopPropagation()}>
                                <FiArrowUp className="ed-voteicon" /><span>{post.upvotes}</span><FiArrowDown className="ed-voteicon" />
                            </div>
                        </div>
                        <div className="ed-postbody">
                            <div className="ed-contentbody"><RenderText text={post.content} /></div>
                            <footer className="ed-postfooter">
                                <FiMessageSquare /> <span>{post.comments_count} comments</span>
                                <button className="ed-view-replies-btn" onClick={() => setShowPostReply(s => !s)}>Reply</button>
                            </footer>

                            {showPostReply && (
                                <div className="ed-reply-box">
                                    <CustomEditor
                                        id="post-reply-editor"
                                        content={postReplyContent}
                                        onContentChange={setPostReplyContent}
                                        placeholder="Write your reply…"
                                        isOverlay={false}
                                        showToolbar={true}
                                        isPlainText={false}
                                        supportMedia={true}
                                        onImageUpload={() => { }}
                                    />
                                    <button onClick={submitPostReply} disabled={!postReplyContent.trim()}>Submit</button>
                                </div>
                            )}
                        </div>
                    </article>

                    {/* COMMENTS TREE */}
                    <section className="ed-comments">
                        <h2>Replies</h2>
                        <div className="ed-comments-tree" ref={treeRef} style={{ position: 'relative' }}>
                            {commentsLoading && <div>Loading comments…</div>}
                            {allComments.map(c => (
                                <Comment
                                    key={c.id}
                                    comment={c}
                                    level={0}
                                    parentId={null}
                                    boxRefs={boxRefs}
                                    parentMap={parentMap}
                                    onReply={onReply}
                                />
                            ))}
                            {hasNextPage && (
                                <button className="ed-load-more" onClick={() => fetchNextPage()}>
                                    Load more comments
                                </button>
                            )}
                            <svg style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} width="100%" height="100%">
                                {connectors.map((c, i) => (
                                    <path
                                        key={i}
                                        d={`M${c.x1},${c.y1} L${c.x2},${c.y2}`}
                                        stroke="var(--ed-line)" strokeWidth="1" fill="none" strokeLinecap="round"
                                    />
                                ))}
                            </svg>
                        </div>
                    </section>
                </div>

                {/* SIDEBAR */}
                {!embedded && (
                    <aside className="ed-sidebar">
                        <div className="ed-sb-section">
                            <h3>Quick Actions</h3>
                            <button className="ed-sb-btn">Follow <RenderText text={`u/${post.author.username}`} /></button>
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


function Comment({ comment, level, parentId, boxRefs, parentMap, onReply }) {
    // all hooks at top
    const [showReplies, setShowReplies] = useState(false);
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const repliesRef = useRef(null);
    const [spineHeight, setSpineHeight] = useState(0);

    const { data: repliesPages, isFetching: repliesLoading, fetchNextPage, hasNextPage } =
        useInfiniteQuery({
            queryKey: ['replies', comment.id],
            queryFn: ({ pageParam = 1 }) => fetchReplies({ commentId: comment.id, pageParam }),
            getNextPageParam: last =>
                last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
            enabled: showReplies
        });

    useLayoutEffect(() => {
        if (!repliesRef.current) return setSpineHeight(0);
        const recalc = () => {
            const ctr = repliesRef.current.getBoundingClientRect();
            const kids = Array.from(repliesRef.current.children)
                .filter(el => el.classList.contains('ed-comment-level'));
            if (!kids.length) return setSpineHeight(0);

            const minY = ctr.top + ELBOW_RADIUS;
            const ys = kids.map(k => {
                const box = k.querySelector('.ed-comment-box.ed-has-line');
                return box
                    ? box.getBoundingClientRect().top + ELBOW_RADIUS
                    : minY;
            });
            const maxY = Math.max(...ys, minY);
            setSpineHeight(Math.ceil(maxY - ctr.top) + 20);
        };
        recalc();
        const ro = new ResizeObserver(recalc);
        ro.observe(repliesRef.current);
        return () => ro.disconnect();
    }, [repliesPages, showReplies]);

    // register for connectors
    const selfRef = useRef(null);
    boxRefs.current[comment.id] = selfRef;
    parentMap.current[comment.id] = parentId;

    const replies = repliesPages?.pages.flatMap(p => p.results) || [];

    const submitReply = () => {
        onReply(replyContent, comment.id);
        setReplyContent('');
        setShowReplyBox(false);
    };

    return (
        <div className="ed-comment-level" ref={selfRef}>
            <div className={`ed-comment-box${level > 0 ? ' ed-has-line' : ''}`}>
                    <div className="ed-votebar">
                        <div className="ed-votebar-inner" onClick={e => e.stopPropagation()}>
                            <FiArrowUp className="ed-voteicon" />
                            <span>{comment.upvotes}</span>
                            <FiArrowDown className="ed-voteicon" />
                        </div>
                    </div>
                <div className='ed-postbody ed-comment-body'>
                    <div className="ed-comment-header">
                        <span className="ed-comment-user"><RenderText text={`u/${comment.author.username}`} /></span>
                        <span className="ed-comment-time">{formatDateTime(comment.created_at)}</span>
                    </div>
                    <div className="ed-comment-text">
                        <RenderText text={comment.content} />
                    </div>
                    <div className="ed-comment-actions">
                        <button className="ed-post-reply-btn" onClick={() => setShowReplyBox(s => !s)}>Reply</button>
                    </div>

                    {showReplyBox && (
                        <div className="ed-reply-box" >
                            <CustomEditor
                                id={`reply-editor-${comment.id}`}
                                content={replyContent}
                                onContentChange={setReplyContent}
                                placeholder="Write your reply…"
                                isOverlay={false}
                                showToolbar={true}
                                isPlainText={false}
                                supportMedia={true}
                                onImageUpload={() => { }}
                            />
                            <button onClick={submitReply} disabled={!replyContent.trim()}>Submit</button>
                        </div>
                    )}
                </div>
            </div>

            {!showReplies && comment.replies_count > 0 && (
                <button className="ed-view-replies-btn" onClick={() => setShowReplies(true)}>
                    Show {comment.replies_count} replies
                </button>
            )}

            {showReplies && (
                <div className="ed-replies" ref={repliesRef}>
                    <svg className="connector-spine" width={ELBOW_RADIUS} height={spineHeight}
                        style={{ position: 'absolute', top: '-1.5rem', left: '-2rem' }}>
                        <path
                            d={`M${ELBOW_RADIUS / 2},${ELBOW_RADIUS} L${ELBOW_RADIUS / 2},${spineHeight}`}
                            stroke="var(--ed-line)" strokeWidth="1" fill="none" strokeLinecap="round"
                        />
                    </svg>

                    {repliesLoading && <div>Loading…</div>}
                    {replies.map(r => (
                        <Comment
                            key={r.id}
                            comment={r}
                            level={level + 1}
                            parentId={comment.id}
                            boxRefs={boxRefs}
                            parentMap={parentMap}
                            onReply={onReply}
                        />
                    ))}

                    {hasNextPage && (
                        <button onClick={() => fetchNextPage()}>Load more replies</button>
                    )}
                </div>
            )}
        </div>
    );
}
