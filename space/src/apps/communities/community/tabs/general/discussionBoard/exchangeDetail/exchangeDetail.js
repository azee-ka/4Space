// src/apps/communities/community/tabs/general/discussionBoard/exchangeDetail/exchangeDetail.jsx
import React, { useState, useRef, useLayoutEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FiArrowUp,
    FiArrowDown,
    FiMessageSquare,
    FiRepeat,
    FiBookmark,
    FiShare2,
    FiExternalLink,
    FiArrowLeft
} from 'react-icons/fi';
import { FaArrowDown, FaArrowUp, FaReply } from 'react-icons/fa';
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
import { formatCount } from '../../../../../../../utils/formatCount';

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
                x1: pRect.left - treeRect.left + ELBOW_RADIUS,
                y1: pRect.bottom - treeRect.top,
                x2: cRect.left - treeRect.left + ELBOW_RADIUS,
                y2: cRect.top - treeRect.top
            });
        });

        setConnectors(newConns);
    }, [commentsPages]);

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
                                <button
                                    className={`vote-btn ${post?.vote_status === "upvoted" ? 'active' : ''} ed-exchange-vote-btn`}
                                // onClick={() => votePost('upvote')}
                                >
                                    <FaArrowUp className="icon-style" />
                                </button>
                                <div className="vote-count ed-exchange-vote-count">
                                    {formatCount(post?.net_votes_count) || 0}
                                </div>
                                <button
                                    className={`vote-btn ${post?.status?.vote_status === "downvoted" ? 'active' : ''} ed-exchange-vote-btn`}
                                // onClick={() => votePost('downvote')}
                                >
                                    <FaArrowDown className="icon-style" />
                                </button>
                            </div>
                        </div>
                        <div className="ed-postbody">
                            <div className="ed-contentbody"><RenderText text={post.content} /></div>
                            <footer className="ed-postfooter">
                                <button className="ed-action-btn">
                                    <FiMessageSquare /> {post.comments_count}
                                </button>
                                <button className="ed-post-reply-btn" onClick={() => setShowPostReply(s => !s)}>
                                    <FaReply /> Reply
                                </button>
                                <button className="ed-action-btn">
                                    <FiRepeat /> {post.reposts_count}
                                </button>
                                <button className="ed-action-btn">
                                    <FiBookmark /> Save
                                </button>
                                <button className="ed-action-btn">
                                    <FiShare2 /> Share
                                </button>
                            </footer>

                            <div className="ed-reply-wrapper">
                        <div className={`ed-reply-box ${showPostReply ? 'ed-open' : ''}`}>
                                    <CustomEditor
                                        id="post-reply-editor"
                                        content={postReplyContent}
                                        onContentChange={setPostReplyContent}
                                        placeholder="Write your reply…"
                                        isOverlay={false}
                                        showToolbar
                                        isPlainText={false}
                                        supportMedia
                                        onImageUpload={() => { }}
                                    />
                                    <button
                                        className="ed-reply-submit-btn"
                                        onClick={submitPostReply}
                                        disabled={!postReplyContent.trim()}
                                    >
                                        Post Reply
                                    </button>
                                </div>
                            </div>
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
                            <svg className="ed-connectors">
                                {connectors.map((c, i) => (
                                    <path
                                        key={i}
                                        d={`M${c.x1},${c.y1} L${c.x2},${c.y2}`}
                                        stroke="var(--ed-line)"
                                        strokeWidth="1"
                                        fill="none"
                                        strokeLinecap="round"
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
                        <button
                            className={`vote-btn ${comment?.vote_status === "upvoted" ? 'active' : ''} ed-exchange-comment-vote-btn`}
                        // onClick={() => votePost('upvote')}
                        >
                            <FaArrowUp className="icon-style" />
                        </button>
                        <div className="vote-count ed-exchange-comment-vote-count">
                            {formatCount(comment?.net_votes_count) || 0}
                        </div>
                        <button
                            className={`vote-btn ${comment?.status?.vote_status === "downvoted" ? 'active' : ''} ed-exchange-comment-vote-btn`}
                        // onClick={() => votePost('downvote')}
                        >
                            <FaArrowDown className="icon-style" />
                        </button>
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
                        <button className="ed-action-btn">
                            <FiMessageSquare /> {comment.replies_count}
                        </button>
                        <button className="ed-action-btn" onClick={() => setShowReplyBox(s => !s)}>
                            <FaReply /> Reply
                        </button>
                        <button className="ed-action-btn">
                            <FiShare2 /> Share
                        </button>
                    </div>

                    <div className="ed-reply-wrapper">
                        <div className={`ed-reply-box ${showReplyBox ? 'ed-open' : ''}`}>
                            <CustomEditor
                                id={`reply-editor-${comment.id}`}
                                content={replyContent}
                                onContentChange={setReplyContent}
                                placeholder="Write your reply…"
                                isOverlay={false}
                                showToolbar
                                isPlainText={false}
                                supportMedia
                                onImageUpload={() => { }}
                            />
                            <button className='ed-reply-submit-btn' onClick={submitReply} disabled={!replyContent.trim()}>
                                Post Reply
                            </button>
                        </div>
                    </div>
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
                        <button className="ed-load-more" onClick={() => fetchNextPage()}>
                            Load more replies
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
