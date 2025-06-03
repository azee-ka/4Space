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
import useApi from "../hooks/useApi"; // ← useApi replaces fetchWithAuth + useAuth
import useAuth from "../hooks/useAuth";

const ExpandPostContext = createContext(null);

export const ExpandPostProvider = ({ children, postId, postData }) => {
    const router = useRouter();
    const { callApi } = useApi(); // ← callApi will automatically include the Bearer token
    const { authState } = useAuth();
    // ── POST STATE ─────────────────────────────────────────────────────────────
    const [post, setPost] = useState(postData || null);
    const [postBookmarked, setPostBookmarked] = useState(false);
    const [isSelfPost, setIsSelfPost] = useState(false);

    // If you still need to mark “isSelfPost” by comparing to a stored username,
    // you would pull that username from Redux (via useApi’s token) or wherever you store it.
    // For now, we simply keep the same pattern but leave the logic untouched:
    useEffect(() => {
        // If your Redux store includes currentUser.username, you could compare here.
        setIsSelfPost(
            post?.author?.username === authState?.user?.username
        );
        // But since useApi does not directly expose “authState.user” here, adjust as needed.
    }, [post]);

    // On‐mount (or whenever postId changes), fetch the post if not already passed in:
    useEffect(() => {
        if (!post && postId) {
            (async () => {
                try {
                    // GET /api/posts/post/{postId}/
                    const response = await callApi(`posts/post/${postId}/`);
                    setPost(response.data);
                } catch (err) {
                    console.error("Error fetching post:", err);
                    setPost(null);
                }
            })();
        }
    }, [postId, post]);

    // ── COMMENTS STATE (limit/offset) ──────────────────────────────────────────
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);

    // Holds the “next” URL (a full URL string) or null
    const [commentsNextPage, setCommentsNextPage] = useState(null);

    // Default limit per page
    const COMMENTS_LIMIT = 10;

    // Utility: convert a full “next” URL (e.g. "http://localhost:8000/api/posts/...") into a relative endpoint.
    const toRelativeEndpoint = (fullUrl) => {
        try {
            const parsed = new URL(fullUrl);
            // include both pathname and search (which contains limit/offset)
            const pathPlusQS = parsed.pathname + parsed.search; 
            return pathPlusQS.replace(/^\/api\//, "");
        } catch {
            // if it was already a relative URL to begin with (e.g. "/posts/..."),
            // just return it unchanged
            return fullUrl;
        }
    };


    // Fetch comments; if `url` is null, fetch first page via limit/offset=0
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
                    // Use the next‐page URL returned by the server
                    endpoint = toRelativeEndpoint(url);
                } else {
                    // First page: offset=0, limit=COMMENTS_LIMIT
                    endpoint = `posts/post/${postId}/comments/?limit=${COMMENTS_LIMIT}&offset=0`;
                }

                // callApi 
                const resp = await callApi(endpoint);
                const data = resp.data;
                const incomingComments = Array.isArray(data.results)
                    ? data.results
                    : [];

                if (url) {
                    // Append additional pages
                    setComments((prev) => {
                       // build a Set of IDs we already have
                       const existingIds = new Set(prev.map((c) => c.id));
                       // only keep those new comments whose ID is not in the Set
                       const filteredNew = incomingComments.filter(
                           (c) => !existingIds.has(c.id)
                       );
                       // append the filtered ones
                       return [...prev, ...filteredNew];
                   })
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
        [postId]
    );

    // On mount (and whenever postId changes), load the first page
    useEffect(() => {
        if (postId) {
            fetchComments();
        }
    }, [postId]);

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
            // POST to /api/posts/post/{postId}/comment/{postId}/create/
            const resp = await callApi(
                `posts/post/comment/${postId}/create/`,
                "POST",
                { text: commentText }
            );
            const newComment = resp.data;

            // Prepend the newly created comment
            setComments((prev) => {
               // filter out any comment in `prev` that has the same id as newComment
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

    // ── OTHER ACTIONS (likes, bookmark, etc.) ──────────────────────────────────
    const toggleLikeDislike = async (toggle_type) => {
        try {
            // POST to /api/posts/post/{postId}/toggle-like-dislike/
            const resp = await callApi(
                `posts/post/${postId}/toggle-like-dislike/`,
                "POST",
                { toggle_type }
            );
            const {
                likes_count,
                dislikes_count,
                like_status,
                dislike_status,
            } = resp.data;
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
        // Optionally POST to server here if you have an endpoint
    };

    const deletePost = async () => {
        try {
            // DELETE to /api/posts/post/{postId}/delete/
            await callApi(`posts/post/${postId}/delete/`, "DELETE");
            router.back();
        } catch (e) {
            Alert.alert("Error", "Could not delete post");
        }
    };

    const votePost = async (vote_type) => {
        try {
            // POST to /api/posts/post/{postId}/vote/
            const resp = await callApi(
                `posts/post/${postId}/vote/`,
                "POST",
                { vote_type }
            );
            const { net_votes_count, vote_status } = resp.data;
            setPost((prev) => ({
                ...prev,
                stats: { ...prev.stats, net_votes_count },
                status: { ...prev.status, vote_status },
            }));
        } catch (e) {
            // silently ignore or show an alert
            console.error('Error voting posts', e);
        }
    };

    const voteComment = async (comment_id, vote_type) => {
        try {
            // POST to /api/posts/post/comment/{comment_id}/vote/
            const resp = await callApi(
                `posts/post/comment/${comment_id}/vote/`,
                "POST",
                { vote_type }
            );
            const { vote_status, net_votes_count } = resp.data;
            setComments((prev) =>
                prev.map((c) =>
                    c.id === comment_id
                        ? { ...c, vote_status, net_votes_count }
                        : c
                )
            );
        } catch (e) {
            // ignore or alert
        }
    };

    const toggleCommentLike = async (comment_id) => {
        try {
            // POST to /api/posts/post/comment/{comment_id}/like/
            const resp = await callApi(
                `posts/post/comment/${comment_id}/like/`,
                "POST"
            );
            const { like_status, likes_count } = resp.data;
            setComments((prev) =>
                prev.map((c) =>
                    c.id === comment_id
                        ? { ...c, like_status, likes_count }
                        : c
                )
            );
        } catch (e) {
            // ignore or alert
        }
    };

    const replyToComment = async (comment_id) => {
        // … you can fill in if you have an endpoint
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
            // POST to /api/posts/post/{post.id}/quote/
            const resp = await callApi(
                `posts/post/${post.id}/quote/`,
                "POST",
                { quote_text: quoteText, quote_comment: quoteComment }
            );
            setShowQuoteModal(false);
            setQuoteComment("");
            setQuoteText("");
            router.push(`/timeline/${resp.data.id}`);
        } catch (e) {
            Alert.alert("Error", "Failed to quote");
        }
    };

    const repostPostConfirmed = async () => {
        setRepostLoading(true);
        setRepostError("");
        setRepostSuccessId(null);
        try {
            // POST to /api/posts/post/{post.id}/repost/
            const resp = await callApi(
                `posts/post/${post.id}/repost/`,
                "POST"
            );
            setRepostSuccessId(resp.data.id);
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
