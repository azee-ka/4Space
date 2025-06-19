import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  POST_DETAIL, POST_COMMENTS, POST_REPOST, POST_QUOTE, POST_VOTE,
  POST_LIKE_STATUS, POST_BOOKMARK, COMMENT_LIKES, COMMENT_VOTES, COMMENT_REPLY, POST_DELETE
} from '../../../services/queryKeys';
import {
  fetchPost, fetchComments, repostPost, quotePost,
  votePost, toggleLikeDislike, toggleBookmark, deletePost,
  addComment, likeComment, voteComment, replyToComment,
} from '../../../services/post';
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

  // UI/Modal state
  const [commentText, setCommentText] = useState('');
  const [commentReplyText, setCommentReplyText] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quoteComment, setQuoteComment] = useState('');
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostError, setRepostError] = useState('');
  const [repostLoading, setRepostLoading] = useState(false);
  const [repostSuccessId, setRepostSuccessId] = useState(null);

  // Like/dislike overlays etc
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const [showDislikesOverlay, setShowDislikesOverlay] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // ---- QUOTE SELECTION logic ----
  const [showQuoteBtn, setShowQuoteBtn] = useState(false);
  const [btnPos, setBtnPos] = useState(null); // {top, left}
  const [selectedText, setSelectedText] = useState('');
  const [quoteSourceRef, setQuoteSourceRef] = useState(null);

  // Post data
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
    initialData: postData || undefined,
  });

  const isSelfPost = post?.author?.username === authState?.user?.username;

  // Comments
  const {
    data: commentsPages = { pages: [], pageParams: [] },
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: POST_COMMENTS(postId),
    queryFn: ({ pageParam = 0 }) => fetchComments({ postId, pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage?.results?.length === 0 ? undefined : pages.length,
    enabled: !!postId,
  });

  const comments = commentsPages.pages.flatMap(p => p.results || []);
  const commentsTotalCount = commentsPages.pages[0]?.count || 0;

  // Mutations
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
    mutationFn: (commentId) => likeComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries(POST_COMMENTS(postId));
      queryClient.invalidateQueries(COMMENT_LIKES(commentId));
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
    onSuccess: (data) => {
      setRepostSuccessId(data.id);
      setRepostError('');
      setRepostLoading(false);
      queryClient.invalidateQueries(POST_DETAIL(postId));
    },
    onError: (e) => {
      setRepostError(e?.response?.data?.error || "Already reposted, or error.");
      setRepostLoading(false);
    }
  });
  const quoteMutation = useMutation({
    mutationKey: POST_QUOTE(postId),
    mutationFn: ({ quote_text, quote_comment }) => quotePost({ postId, quote_text, quote_comment }),
    onSuccess: (data) => {
      setShowQuoteModal(false);
      setQuoteComment('');
      setQuoteText('');
      navigate(`/posts/p/${data.id}`);
    },
    onError: () => alert("Failed to quote"),
  });
  const deleteMutation = useMutation({
    mutationKey: POST_DELETE(postId),
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      // Optionally navigate away, show a toast, etc.
    },
  });
  const bookmarkMutation = useMutation({
    mutationKey: POST_BOOKMARK(postId),
    mutationFn: ({ method }) => toggleBookmark(postId, method),
    onSuccess: () => queryClient.invalidateQueries(POST_DETAIL(postId)),
  });

  // --- Handlers as before ---

  const toggleLikeDislikeHandler = (toggle_type) => likeDislikeMutation.mutate({ toggle_type });
  const votePostHandler = (vote_type) => votePostMutation.mutate({ vote_type });
  const addCommentHandler = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ text: commentText });
  };
  const toggleCommentLikeHandler = (commentId) => likeCommentMutation.mutate(commentId);
  const voteCommentHandler = (commentId, vote_type) => voteCommentMutation.mutate({ commentId, vote_type });
  const replyToCommentHandler = (commentId) => {
    if (!commentReplyText.trim()) return;
    replyToCommentMutation.mutate({ commentId, text: commentReplyText });
  };
  const repostPostHandler = () => repostMutation.mutate();
  const submitQuote = () => {
    if (!quoteComment.trim()) return;
    quoteMutation.mutate({ quote_text: quoteText, quote_comment: quoteComment });
  };
  const deletePostHandler = () => deleteMutation.mutate();
  const toggleBookmarkHandler = (method) => bookmarkMutation.mutate({ method });
  const loadMoreComments = fetchNextPage;

  // Media nav
  const navigateMedia = (direction) => {
    if (!post?.post?.media_files) return;
    setCurrentMediaIndex((prevIndex) => {
      const maxIndex = post.post.media_files.length - 1;
      if (direction === 'next' && prevIndex < maxIndex) return prevIndex + 1;
      if (direction === 'prev' && prevIndex > 0) return prevIndex - 1;
      return prevIndex;
    });
  };

  // Render media content
  const renderMediaContent = () => {
    const mediaFile = post?.post?.media_files?.[currentMediaIndex];
    if (!mediaFile) return null;
    if (mediaFile.media_type === 'video') {
      return <VideoPlayer mediaFile={mediaFile} />;
    } else {
      return <img src={mediaFile.file} alt={mediaFile.id} />;
    }
  };

  // Overlay helpers
  const handleCloseLikesOverlay = () => {
    setShowLikesOverlay(false);
    setShowDislikesOverlay(false);
  };

  // ---- QUOTE SELECTION handler ----
  // Function that returns a handler function for selection events
  const handleSelection = useCallback((contentRef) => (e) => {
    const selection = window.getSelection();
    const text = selection.toString();

    if (!contentRef?.current?.contains(selection.anchorNode) || !text.length) {
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
    setBtnPos({
      top: rect.top + window.scrollY - 38,
      left: rect.left + window.scrollX + rect.width / 2,
    });

    setShowQuoteBtn(true);
    setSelectedText(text);
    setQuoteSourceRef(contentRef);
  }, []);

  // ---- Context value ----
  const value = {
    post, refetchPost, postLoading, isSelfPost,
    comments, commentsTotalCount, loadMoreComments, hasMore: hasNextPage, commentsLoading: isFetchingNextPage, refetchComments,
    commentText, setCommentText,
    commentReplyText, setCommentReplyText,
    addComment: addCommentHandler,
    deletePost: deletePostHandler,
    votePost: votePostHandler,
    toggleLikeDislike: toggleLikeDislikeHandler,
    toggleBookmark: toggleBookmarkHandler,
    toggleCommentLike: toggleCommentLikeHandler,
    voteComment: voteCommentHandler,
    replyToComment: replyToCommentHandler,
    showLikesOverlay, setShowLikesOverlay,
    showDislikesOverlay, setShowDislikesOverlay,
    currentMediaIndex, setCurrentMediaIndex,
    navigateMedia, renderMediaContent,
    handleCloseLikesOverlay,
    // ---- QUOTE/SELECTION BUTTON LOGIC ----
    handleSelection,
    showQuoteBtn, setShowQuoteBtn,
    btnPos, setBtnPos,
    selectedText, setSelectedText,
    showQuoteModal, setShowQuoteModal,
    quoteText, setQuoteText,
    quoteComment, setQuoteComment,
    submitQuote,
    showRepostModal, setShowRepostModal,
    repostError, repostLoading, repostSuccessId,
    repostPost: repostPostHandler,
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
