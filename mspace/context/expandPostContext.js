// /context/expandPostContext.js

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import useApi from "../hooks/useApi";
import useAuth from "../hooks/useAuth";

const ExpandPostContext = createContext(null);

export const ExpandPostProvider = ({ children, postId, postData }) => {
  const router = useRouter();
  const { callApi } = useApi();
  const { authState } = useAuth();

  // ── POST STATE ─────────────────────────────────────────────────────────────
  const [post, setPost] = useState(postData || null);
  const [postBookmarked, setPostBookmarked] = useState(false);
  const [isSelfPost, setIsSelfPost] = useState(false);

  // Determine if current user is the author
  useEffect(() => {
    setIsSelfPost(post?.author?.username === authState?.user?.username);
  }, [post, authState]);

  // Fetch post data if not pre-fetched
  useEffect(() => {
    if (!post && postId) {
      (async () => {
        try {
          const response = await callApi(`posts/post/${postId}/`);
          setPost(response.data);
        } catch (err) {
          console.error("Error fetching post:", err);
          setPost(null);
        }
      })();
    }
  }, [post, postId]);

  // ── COMMENTS STATE (limit/offset) ──────────────────────────────────────────
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const [commentsNextPage, setCommentsNextPage] = useState(null);

  // Default limit per page
  const COMMENTS_LIMIT = 10;

  // Utility: convert a full “next” URL into a relative endpoint
  const toRelativeEndpoint = (fullUrl) => {
    try {
      const parsed = new URL(fullUrl);
      // include pathname + search (limit/offset)
      let pathPlusQS = parsed.pathname + parsed.search;
      // strip leading "/api/" if present
      return pathPlusQS.replace(/^\/api\//, "");
    } catch {
      // already relative
      return fullUrl;
    }
  };

  // Fetch comments; if `url` is null → first page; otherwise use URL from server
  const fetchComments = useCallback(
    async (url = null) => {
      try {
        if (url) {
          setCommentsLoadingMore(true);
        } else {
          setCommentsLoading(true);
        }

        let endpoint;
        if (url) {
          endpoint = toRelativeEndpoint(url);
        } else {
          endpoint = `posts/post/${postId}/comments/?limit=${COMMENTS_LIMIT}&offset=0`;
        }

        const resp = await callApi(endpoint);
        const data = resp.data;
        const incomingComments = Array.isArray(data.results) ? data.results : [];

        if (url) {
          // append new page but filter out duplicates by ID
          setComments((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const filteredNew = incomingComments.filter((c) => !existingIds.has(c.id));
            return [...prev, ...filteredNew];
          });
        } else {
          // first page → replace
          setComments(incomingComments);
        }

        setCommentsNextPage(data.next || null);
      } catch (err) {
        console.error("Error fetching comments:", err);
        Alert.alert("Error", "Could not load comments");
      } finally {
        setCommentsLoading(false);
        setCommentsLoadingMore(false);
      }
    },
    [postId]
  );

  // On mount (and whenever postId changes), load first page of comments
  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId, fetchComments]);

  // Called by UI when scrolling near bottom
  const loadMoreComments = () => {
    if (commentsNextPage && !commentsLoadingMore) {
      fetchComments(commentsNextPage);
    }
  };

  // ── ADD COMMENT ─────────────────────────────────────────────────────────────
  const [commentText, setCommentText] = useState("");
  const addComment = async () => {
    if (!commentText.trim()) return;

    try {
      const resp = await callApi(`posts/post/comment/${postId}/create/`, "POST", {
        text: commentText,
      });
      const newComment = resp.data;

      // Prepend the newly created comment, filtering out any duplicate
      setComments((prev) => {
        const withoutDuplicate = prev.filter((c) => c.id !== newComment.id);
        return [newComment, ...withoutDuplicate];
      });
      setCommentText("");

      // Update the post’s comment count
      setPost((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          comments_count: (prev.stats?.comments_count || 0) + 1,
        },
      }));
    } catch (e) {
      console.error("Failed to add comment:", e);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  // ── DELETE POST ─────────────────────────────────────────────────────────────
  const deletePost = async () => {
    try {
      await callApi(`posts/post/${postId}/delete/`, "DELETE");
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not delete post");
    }
  };

  // ── LIKE / DISLIKE POST ─────────────────────────────────────────────────────
  const toggleLikeDislike = async (toggle_type) => {
    try {
      const resp = await callApi(`posts/post/${postId}/toggle-like-dislike/`, "POST", {
        toggle_type,
      });
      const { likes_count, dislikes_count, like_status, dislike_status } = resp.data;
      setPost((prev) => ({
        ...prev,
        stats: { ...prev.stats, likes_count, dislikes_count },
        status: { ...prev.status, like_status, dislike_status },
      }));
    } catch (e) {
      Alert.alert("Error", "Could not update like/dislike");
    }
  };

  // ── BOOKMARK POST ────────────────────────────────────────────────────────────
  const toggleBookmark = async () => {
    setPostBookmarked((b) => !b);
    // If you have a server endpoint for bookmarking, call it here.
  };

  // ── VOTE ON POST ─────────────────────────────────────────────────────────────
  const votePost = async (vote_type) => {
    try {
      const resp = await callApi(`posts/post/${postId}/vote/`, "POST", { vote_type });
      const { net_votes_count, vote_status } = resp.data;
      setPost((prev) => ({
        ...prev,
        stats: { ...prev.stats, net_votes_count },
        status: { ...prev.status, vote_status },
      }));
    } catch (e) {
      console.error("Error voting post:", e);
    }
  };

  // ── LIKE / DISLIKE COMMENT ───────────────────────────────────────────────────
  const toggleCommentLike = async (comment_id) => {
    try {
      const resp = await callApi(`posts/post/comment/${comment_id}/like/`, "POST");
      const { like_status, likes_count } = resp.data;
      setComments((prev) =>
        prev.map((c) => (c.id === comment_id ? { ...c, like_status, likes_count } : c))
      );
    } catch (e) {
      console.error("Error toggling comment like:", e);
    }
  };

  // ── VOTE ON COMMENT ─────────────────────────────────────────────────────────
  const voteComment = async (comment_id, vote_type) => {
    try {
      const resp = await callApi(`posts/post/comment/${comment_id}/vote/`, "POST", {
        vote_type,
      });
      const { net_votes_count, vote_status } = resp.data;
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment_id ? { ...c, net_votes_count, vote_status } : c
        )
      );
    } catch (e) {
      console.error("Error voting comment:", e);
    }
  };

  // ── REPLY TO COMMENT ─────────────────────────────────────────────────────────
  // (If you implement a “reply” endpoint, fill this in the same way.)
  const replyToComment = async (comment_id) => {
    // … optional: POST to `posts/post/comment/${comment_id}/reply/`
  };

  // ── MEDIA NAVIGATION ────────────────────────────────────────────────────────
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const navigateMedia = (direction) => {
    const files = post?.media_files || post?.post?.media_files || [];
    setCurrentMediaIndex((idx) => {
      if (direction === "next" && idx < files.length - 1) return idx + 1;
      if (direction === "prev" && idx > 0) return idx - 1;
      return idx;
    });
  };

  // ── OVERLAYS & MODALS ───────────────────────────────────────────────────────
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const [showDislikesOverlay, setShowDislikesOverlay] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [quoteComment, setQuoteComment] = useState("");
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);
  const [repostError, setRepostError] = useState("");
  const [repostSuccessId, setRepostSuccessId] = useState(null);

  const handleCloseLikesOverlay = () => {
    setShowLikesOverlay(false);
    setShowDislikesOverlay(false);
  };

  // ── SUBMIT QUOTE ────────────────────────────────────────────────────────────
  const submitQuote = async () => {
    if (!post?.id || !quoteComment.trim()) return;
    try {
      const resp = await callApi(`posts/post/${post.id}/quote/`, "POST", {
        quote_text: quoteText,
        quote_comment: quoteComment,
      });
      setShowQuoteModal(false);
      setQuoteComment("");
      setQuoteText("");
      router.push(`/timeline/${resp.data.id}`);
    } catch (e) {
      Alert.alert("Error", "Failed to quote");
    }
  };

  // ── REPOST POST ──────────────────────────────────────────────────────────────
  const repostPostConfirmed = async () => {
    setRepostLoading(true);
    setRepostError("");
    setRepostSuccessId(null);
    try {
      const resp = await callApi(`posts/post/${post.id}/repost/`, "POST");
      setRepostSuccessId(resp.data.id);
    } catch (e) {
      setRepostError("Already reposted, or error.");
    }
    setRepostLoading(false);
  };

  // ── CONTEXT VALUE ───────────────────────────────────────────────────────────
  const value = {
    // Post data
    post,
    setPost,
    postBookmarked,
    isSelfPost,

    // Comments & pagination
    comments,
    commentsLoading,
    commentsLoadingMore,
    commentsNextPage,
    commentText,
    setCommentText,
    addComment,
    loadMoreComments,

    // Post actions
    toggleLikeDislike,
    toggleBookmark,
    deletePost,
    votePost,
    voteComment,

    // Comment actions
    toggleCommentLike,
    replyToComment,

    // Media & overlays
    currentMediaIndex,
    setCurrentMediaIndex,
    navigateMedia,
    showLikesOverlay,
    setShowLikesOverlay,
    showDislikesOverlay,
    setShowDislikesOverlay,
    handleCloseLikesOverlay,
    showQuoteModal,
    setShowQuoteModal,
    quoteText,
    setQuoteText,
    quoteComment,
    setQuoteComment,
    submitQuote,
    showRepostModal,
    setShowRepostModal,
    repostLoading,
    repostError,
    repostSuccessId,
    repostPostConfirmed,

    router,
  };

  return (
    <ExpandPostContext.Provider value={value}>
      {children}
      {/* If you need to render any quote/repost modal overlays, render them here */}
    </ExpandPostContext.Provider>
  );
};

export const useExpandPostContext = () => useContext(ExpandPostContext);
