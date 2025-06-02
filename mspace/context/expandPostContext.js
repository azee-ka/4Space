// /context/expandPostContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Alert } from "react-native";
import fetchWithAuth from "../utils/fetchWithAuth";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";

const ExpandPostContext = createContext(null);

export const ExpandPostProvider = ({ children, postId, postData }) => {
  const router = useRouter();
  const { authState } = useAuth();

  // ── POST STATE ─────────────────────────────────────────────────────────────
  const [post, setPost] = useState(postData || null);
  const [postBookmarked, setPostBookmarked] = useState(false);
  const [isSelfPost, setIsSelfPost] = useState(false);

  useEffect(() => {
    setIsSelfPost(
      post?.author?.username === authState?.user?.username
    );
  }, [post, authState]);

  useEffect(() => {
    if (!post && postId) {
      fetchWithAuth(`posts/post/${postId}/`, {
        method: "GET",
        authState,
      })
        .then((data) => {
          setPost(data);
        })
        .catch((err) => {
          console.error("Error fetching post:", err);
          setPost(null);
        });
    }
  }, [postId, post, authState]);

  // ── COMMENTS STATE (limit/offset) ──────────────────────────────────────────
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);

  // Holds the “next” URL (a full URL string) or null
  const [commentsNextPage, setCommentsNextPage] = useState(null);

  // Default limit per page
  const COMMENTS_LIMIT = 10;

  // Fetch comments; if `url` is null, fetch the first page via limit/offset=0
  const fetchComments = useCallback(
    async (url = null) => {
      try {
        if (url) {
          setCommentsLoadingMore(true);
        } else {
          setCommentsLoading(true);
        }

        let fetchUrl;
        if (url) {
          // Use the next‐page URL returned by the server
          fetchUrl = url;
        } else {
          // First page: offset=0, limit=COMMENTS_LIMIT
          fetchUrl = `posts/post/${postId}/comments/?limit=${COMMENTS_LIMIT}&offset=0`;
        }

        /**
         * Expect server response shape (LimitOffsetPagination):
         * {
         *   count: <total_count>,
         *   next: "http://.../comments/?limit=10&offset=10" or null,
         *   previous: "...", 
         *   results: [ { id, text, author: {...}, created_at, ... }, … ]
         * }
         */
        const data = await fetchWithAuth(fetchUrl, {
          method: "GET",
          authState,
        });

        const incomingComments = Array.isArray(data.results)
          ? data.results
          : [];

        if (url) {
          // Append additional pages
          setComments((prev) => [...prev, ...incomingComments]);
        } else {
          // First‐time load (replace)
          setComments(incomingComments);
        }

        // Update “next page” URL (or null)
        setCommentsNextPage(data.next || null);
      } catch (err) {
        console.error("Error fetching comments:", err);
        Alert.alert("Error", "Could not load comments");
      } finally {
        setCommentsLoading(false);
        setCommentsLoadingMore(false);
      }
    },
    [postId, authState]
  );

  // On mount (and whenever postId changes), load the first page
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
      const data = await fetchWithAuth(
        `posts/post/comment/${postId}/create/`,
        { method: "POST", data: { text: commentText }, authState }
      );

      // Prepend the newly created comment
      setComments((prev) => [data, ...prev]);
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

  // ── OTHER ACTIONS (likes, bookmark, etc.) ──────────────────────────────────
  const toggleLikeDislike = async (toggle_type) => {
    try {
      const data = await fetchWithAuth(
        `posts/post/${postId}/toggle-like-dislike/`,
        { method: "POST", data: { toggle_type }, authState }
      );
      const {
        likes_count,
        dislikes_count,
        like_status,
        dislike_status,
      } = data;
      setPost((prev) => ({
        ...prev,
        stats: { ...prev.stats, likes_count, dislikes_count },
        status: { ...prev.status, like_status, dislike_status },
      }));
    } catch (e) {
      Alert.alert("Error", "Could not update like/dislike");
    }
  };

  const toggleBookmark = async () => {
    setPostBookmarked((b) => !b);
    // Optionally POST to server here
  };

  const deletePost = async () => {
    try {
      await fetchWithAuth(`posts/post/${postId}/delete/`, {
        method: "DELETE",
        authState,
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not delete post");
    }
  };

  const votePost = async (vote_type) => {
    try {
      const data = await fetchWithAuth(
        `posts/post/${postId}/vote/`,
        { method: "POST", data: { vote_type }, authState }
      );
      const { net_votes_count, vote_status } = data;
      setPost((prev) => ({
        ...prev,
        stats: { ...prev.stats, net_votes_count },
        status: { ...prev.status, vote_status },
      }));
    } catch (e) {}
  };

  const voteComment = async (comment_id, vote_type) => {
    try {
      const data = await fetchWithAuth(
        `posts/post/comment/${comment_id}/vote/`,
        { method: "POST", data: { vote_type }, authState }
      );
      const { vote_status, net_votes_count } = data;
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment_id
            ? { ...c, vote_status, net_votes_count }
            : c
        )
      );
    } catch (e) {}
  };

  const toggleCommentLike = async (comment_id) => {
    try {
      const data = await fetchWithAuth(
        `posts/post/comment/${comment_id}/like/`,
        { method: "POST", authState }
      );
      const { like_status, likes_count } = data;
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment_id
            ? { ...c, like_status, likes_count }
            : c
        )
      );
    } catch (e) {}
  };

  const replyToComment = async (comment_id) => {
    // …
  };

  // ── MEDIA, OVERLAYS & MODALS ───────────────────────────────────────────────
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const navigateMedia = (direction) => {
    const files = post?.media_files || post?.post?.media_files || [];
    setCurrentMediaIndex((idx) => {
      if (direction === "next" && idx < files.length - 1) return idx + 1;
      if (direction === "prev" && idx > 0) return idx - 1;
      return idx;
    });
  };

  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const [showDislikesOverlay, setShowDislikesOverlay] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [quoteComment, setQuoteComment] = useState("");
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);
  const [repostError, setRepostError] = useState("");
  const [repostSuccessId, setRepostSuccessId] = useState(null);

  const submitQuote = async () => {
    if (!post?.id || !quoteComment.trim()) return;
    try {
      const data = await fetchWithAuth(
        `posts/post/${post.id}/quote/`,
        {
          method: "POST",
          data: { quote_text: quoteText, quote_comment: quoteComment },
          authState,
        }
      );
      setShowQuoteModal(false);
      setQuoteComment("");
      setQuoteText("");
      router.push(`/timeline/${data.id}`);
    } catch (e) {
      Alert.alert("Error", "Failed to quote");
    }
  };

  const repostPostConfirmed = async () => {
    setRepostLoading(true);
    setRepostError("");
    setRepostSuccessId(null);
    try {
      const data = await fetchWithAuth(
        `posts/post/${post.id}/repost/`,
        { method: "POST", authState }
      );
      setRepostSuccessId(data.id);
    } catch (e) {
      setRepostError("Already reposted, or error.");
    }
    setRepostLoading(false);
  };

  const handleCloseLikesOverlay = () => {
    setShowLikesOverlay(false);
    setShowDislikesOverlay(false);
  };

  // ── CONTEXT VALUE ───────────────────────────────────────────────────────────
  const value = {
    post,
    setPost,
    postBookmarked,
    isSelfPost,

    // Comments & pagination (limit/offset)
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
      {/* Any QuoteModal / RepostModal can go here */}
    </ExpandPostContext.Provider>
  );
};

export const useExpandPostContext = () => useContext(ExpandPostContext);
