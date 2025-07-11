// src/components/post/expand/ExpandPostContext.jsx

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  POST_DETAIL,
  POST_COMMENTS,
  POST_REPOST,
  POST_QUOTE,
  POST_VOTE,
  POST_LIKE_STATUS,
  POST_BOOKMARK,
  COMMENT_LIKES,
  COMMENT_VOTES,
  COMMENT_REPLY,
  POST_DELETE,
} from '../../../services/queryKeys';
import {
  fetchPost,
  fetchComments,
  repostPost,
  quotePost,
  votePost,
  toggleLikeDislike,
  toggleBookmark as postToggleBookmark,
  deletePost,
  addComment,
  likeComment,
  voteComment,
  replyToComment,
} from '../../../services/post';
import { 
  fetchMyCollections,
  addItemToCollection,
  removeItemFromCollection 
} from '../../../services/collections';
import VideoPlayer from '../../videoPlayer/videoPlayer';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import QuoteModal from './quoteModal/quoteModal';
import RepostModal from './repostModal/repostModal';

const ExpandPostContext = createContext();

export const ExpandPostProvider = ({ children, postId, postData }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { authState } = useAuth();

  // UI / modal state
  const [commentText, setCommentText] = useState('');
  const [commentReplyText, setCommentReplyText] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quoteComment, setQuoteComment] = useState('');
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostError, setRepostError] = useState('');
  const [repostLoading, setRepostLoading] = useState(false);
  const [repostSuccessId, setRepostSuccessId] = useState(null);

  // overlays
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const [showDislikesOverlay, setShowDislikesOverlay] = useState(false);

  // media
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // quote‐selection
  const [showQuoteBtn, setShowQuoteBtn] = useState(false);
  const [btnPos, setBtnPos] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [quoteSourceRef, setQuoteSourceRef] = useState(null);

  // ─── POST DETAIL ────────────────────────────────────────────────────────────
  const {
    data: post,
    isLoading: postLoading,
    refetch: refetchPost,
    isError: postError,
  } = useQuery({
    queryKey: POST_DETAIL(postId),
    queryFn: () => fetchPost(postId),
    enabled: !!postId,
    staleTime: 30_000,
    initialData: postData,
  });



  const isSelfPost = post?.author?.username === authState?.user?.username;

  // ─── COMMENTS ───────────────────────────────────────────────────────────────
  const {
    data: commentsPages = { pages: [], pageParams: [] },
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: POST_COMMENTS(postId),
    queryFn: ({ pageParam = 0 }) => fetchComments({ postId, pageParam }),
    getNextPageParam: (last, pages) =>
      last.results.length === 0 ? undefined : pages.length,
    enabled: !!postId,
  });

  const comments = commentsPages.pages.flatMap(p => p.results || []);
  const commentsTotalCount = commentsPages.pages[0]?.count || 0;

  // ─── COLLECTIONS & BOOKMARKS ────────────────────────────────────────────────
  // ★ NEW: fetch user's collections with `contains` flags
  const {
    data: collections = [],
    isLoading: collectionsLoading,
  } = useQuery({
    queryKey: ['myCollections', postId],
    queryFn: () => fetchMyCollections({ contentType: 'post', objectId: postId }),
    enabled: !!postId,
  });

  const addCollItem = useMutation({
    mutationFn: addItemToCollection,
    onSuccess: () => queryClient.invalidateQueries(['myCollections', postId]),
  });

  const removeCollItem = useMutation({
    mutationFn: removeItemFromCollection,
    onSuccess: () => queryClient.invalidateQueries(['myCollections', postId]),
  });

  const toggleCollectionItem = (collectionId, contains, visibility) => {
    const payload = {
      collection_id: collectionId,
      content_type: 'post',
      object_id: postId,
      visibility,
    };
    if (contains) {
      removeCollItem.mutate(payload);
    } else {
      addCollItem.mutate(payload);
    }
  };

  // ★ NEW: bookmark via API
  const bookmarkMutation = useMutation({
    mutationKey: POST_BOOKMARK(postId),
    mutationFn: ({ method }) => postToggleBookmark(postId, method),
    onSuccess: () => queryClient.invalidateQueries(POST_DETAIL(postId)),
  });
  const toggleBookmark = method => bookmarkMutation.mutate({ method });

  // ─── OTHER MUTATIONS ────────────────────────────────────────────────────────
  const likeDislikeMutation = useMutation({
    mutationKey: POST_LIKE_STATUS(postId),
    mutationFn: ({ toggle_type }) => toggleLikeDislike({ postId, toggle_type }),
    onSuccess: () => queryClient.invalidateQueries(POST_DETAIL(postId)),
  });
  const votePostMutation = useMutation({
    mutationKey: POST_VOTE(postId),
    mutationFn: ({ vote_type }) => votePost({ postId, vote_type }),
    onSuccess: () => queryClient.invalidateQueries(POST_DETAIL(postId)),
  });
  const addCommentMutation = useMutation({
    mutationKey: POST_COMMENTS(postId),
    mutationFn: ({ text }) => addComment({ postId, text }),
    onSuccess: () => {
      queryClient.invalidateQueries(POST_COMMENTS(postId));
      queryClient.invalidateQueries(POST_DETAIL(postId));
      setCommentText('');
    },
  });
  const likeCommentMutation = useMutation({
    mutationFn: cId => likeComment(cId),
    onSuccess: (_, cId) => {
      queryClient.invalidateQueries(POST_COMMENTS(postId));
      queryClient.invalidateQueries(COMMENT_LIKES(cId));
    },
  });
  const voteCommentMutation = useMutation({
    mutationFn: ({ commentId, vote_type }) => voteComment({ commentId, vote_type }),
    onSuccess: (_, { commentId }) => {
      queryClient.invalidateQueries(POST_COMMENTS(postId));
      queryClient.invalidateQueries(COMMENT_VOTES(commentId));
    },
  });
  const replyToCommentMutation = useMutation({
    mutationFn: ({ commentId, text }) => replyToComment({ commentId, text }),
    onSuccess: () => {
      queryClient.invalidateQueries(POST_COMMENTS(postId));
      setCommentReplyText('');
    },
  });
  const repostMutation = useMutation({
    mutationKey: POST_REPOST(postId),
    mutationFn: () => repostPost(postId),
    onMutate: () => setRepostLoading(true),
    onSuccess: data => {
      setRepostSuccessId(data.id);
      setRepostError('');
      setRepostLoading(false);
      queryClient.invalidateQueries(POST_DETAIL(postId));
    },
    onError: e => {
      setRepostError(e?.response?.data?.error || 'Already reposted, or error.');
      setRepostLoading(false);
    },
  });
  const quoteMutation = useMutation({
    mutationKey: POST_QUOTE(postId),
    mutationFn: ({ quote_text, quote_comment }) =>
      quotePost({ postId, quote_text, quote_comment }),
    onSuccess: data => {
      setShowQuoteModal(false);
      setQuoteComment('');
      setQuoteText('');
      navigate(`/posts/p/${data.id}`);
    },
    onError: () => alert('Failed to quote'),
  });
  const deleteMutation = useMutation({
    mutationKey: POST_DELETE(postId),
    mutationFn: () => deletePost(postId),
    onSuccess: () => { /* navigate away if desired */ },
  });

  // --- Handlers as before ---
  const toggleLikeDislikeHandler = t => likeDislikeMutation.mutate({ toggle_type: t });
  const votePostHandler        = v => votePostMutation.mutate({ vote_type: v });
  const addCommentHandler      = () => { if (commentText.trim()) addCommentMutation.mutate({ text: commentText }); };
  const toggleCommentLike      = cId => likeCommentMutation.mutate(cId);
  const voteCommentHandler     = (cId, v) => voteCommentMutation.mutate({ commentId: cId, vote_type: v });
  const replyToCommentHandler  = cId => { if (commentReplyText.trim()) replyToCommentMutation.mutate({ commentId: cId, text: commentReplyText }); };
  const repostPostHandler      = () => repostMutation.mutate();
  const submitQuote            = () => { if (quoteComment.trim()) quoteMutation.mutate({ quote_text: quoteText, quote_comment: quoteComment }); };
  const deletePostHandler      = () => deleteMutation.mutate();
  const toggleBookmarkHandler  = m => toggleBookmark(m);
  const loadMoreComments       = fetchNextPage;

  // Media nav
  const navigateMedia = direction => {
    if (!post?.post?.media_files) return;
    setCurrentMediaIndex(prev => {
      const max = post.post.media_files.length - 1;
      if (direction === 'next' && prev < max) return prev + 1;
      if (direction === 'prev' && prev > 0) return prev - 1;
      return prev;
    });
  };

  // Render media
  const renderMediaContent = () => {
    const mediaFile = post?.post?.media_files?.[currentMediaIndex];
    if (!mediaFile) return null;
    return mediaFile.media_type === 'video'
      ? <VideoPlayer mediaFile={mediaFile} />
      : <img src={mediaFile.file} alt={mediaFile.id} />;
  };

  // Overlay helper
  const handleCloseLikesOverlay = () => {
    setShowLikesOverlay(false);
    setShowDislikesOverlay(false);
  };

  // Quote selection
  const handleSelection = useCallback(contentRef => e => {
    const selection = window.getSelection();
    const text = selection.toString();
    if (!contentRef?.current?.contains(selection.anchorNode) || !text) {
      setShowQuoteBtn(false);
      setSelectedText('');
      setBtnPos(null);
      document.querySelectorAll('[data-quote-anchor="true"]').forEach(el => el.remove());
      return;
    }
    document.querySelectorAll('[data-quote-anchor="true"]').forEach(el => el.remove());
    const range = selection.getRangeAt(0);
    const endRange = range.cloneRange();
    endRange.collapse(false);
    const span = document.createElement('span');
    span.setAttribute('data-quote-anchor', 'true');
    span.style.display = 'inline-block';
    span.style.width = '0';
    span.style.height = '0';
    endRange.insertNode(span);
    const rect = span.getBoundingClientRect();
    setBtnPos({ top: rect.top + window.scrollY - 38, left: rect.left + window.scrollX + rect.width/2 });
    setShowQuoteBtn(true);
    setSelectedText(text);
    setQuoteSourceRef(contentRef);
  }, []);

  // ─── CONTEXT VALUE ─────────────────────────────────────────────────────────
  const value = {
    post, postLoading, postError, isSelfPost, refetchPost,
    comments, commentsTotalCount, loadMoreComments, hasMoreComments: hasNextPage, commentsLoading: isFetchingNextPage, refetchComments,
    collections, collectionsLoading, toggleCollectionItem,
    toggleBookmark: toggleBookmarkHandler,
    addComment: addCommentHandler,     commentText,    setCommentText,
    replyToComment: replyToCommentHandler, commentReplyText, setCommentReplyText,
    toggleLikeDislike: toggleLikeDislikeHandler, votePost: votePostHandler,
    toggleCommentLike, voteComment: voteCommentHandler,
    showLikesOverlay, setShowLikesOverlay, showDislikesOverlay, setShowDislikesOverlay,
    currentMediaIndex, navigateMedia, renderMediaContent,
    handleCloseLikesOverlay,
    showQuoteBtn, setShowQuoteBtn, btnPos, setBtnPos, selectedText, setSelectedText, handleSelection,
    showQuoteModal, setShowQuoteModal, quoteText, setQuoteText, quoteComment, setQuoteComment, submitQuote,
    showRepostModal, setShowRepostModal, repostError, repostLoading, repostSuccessId, repostPost: repostPostHandler,
    deletePost: deletePostHandler,
  };

  return (
    <ExpandPostContext.Provider value={value}>
      {children}

      {showQuoteModal && (
        <QuoteModal
          post={post}
          quoteText={quoteText}
          quoteComment={quoteComment}
          setQuoteComment={setQuoteComment}
          onSubmit={submitQuote}
          onClose={() => {
            setShowQuoteModal(false);
            setQuoteComment('');
            setQuoteText('');
          }}
        />
      )}

      {showRepostModal && (
        <RepostModal
          post={post}
          repostError={repostError}
          repostLoading={repostLoading}
          repostSuccessId={repostSuccessId}
          onGoToRepost={() => {
            setShowRepostModal(false);
            setRepostError('');
            setRepostSuccessId(null);
            navigate(`/posts/p/${repostSuccessId}`);
          }}
          onClose={() => {
            setShowRepostModal(false);
            setRepostError('');
            setRepostSuccessId(null);
          }}
          onConfirm={repostPostHandler}
        />
      )}
    </ExpandPostContext.Provider>
  );
};

export const useExpandPostContext = () => useContext(ExpandPostContext);
