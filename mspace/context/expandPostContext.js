// app/(tabs)/timeline/ExpandPostContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../utils/apiUrl';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'expo-router';

const ExpandPostContext = createContext(null);

export const ExpandPostProvider = ({ children, postId, postData }) => {
  const router = useRouter();
  const { authState } = useAuth();
  // Post state
  const [post, setPost] = useState(postData || null);
  const [postBookmarked, setPostBookmarked] = useState(false);
  const [isSelfPost, setIsSelfPost] = useState(false);

  // Comment state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentReplyText, setCommentReplyText] = useState('');

  // Overlay/modals
  const [showLikesOverlay, setShowLikesOverlay] = useState(false);
  const [showDislikesOverlay, setShowDislikesOverlay] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quoteComment, setQuoteComment] = useState('');
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);
  const [repostError, setRepostError] = useState('');
  const [repostSuccessId, setRepostSuccessId] = useState(null);

  // Media
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // ----------------- EFFECTS -----------------
  useEffect(() => {
    setIsSelfPost(post?.author?.username === authState?.user?.username);
  }, [post, authState]);

  useEffect(() => {
    if (!post && postId) {
      axios.get(`${API_BASE_URL}posts/${postId}/`)
        .then(resp => setPost(resp.data))
        .catch(() => setPost(null));
    }
  }, [postId, post]);

  // ----------------- ACTIONS -----------------
  // Likes/Dislikes
  const toggleLikeDislike = async (toggle_type) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}posts/post/${postId}/toggle-like-dislike/`, { toggle_type });
      const { likes_count, dislikes_count, like_status, dislike_status } = resp.data;
      setPost(prev => ({
        ...prev,
        stats: { ...prev.stats, likes_count, dislikes_count },
        status: { ...prev.status, like_status, dislike_status },
      }));
    } catch (e) {
      Alert.alert('Error', 'Could not update like/dislike');
    }
  };

  // Bookmark
  const toggleBookmark = async () => {
    // Replace this with your API call if you want to sync with backend
    setPostBookmarked(b => !b);
  };

  // Add comment
  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const resp = await axios.post(`${API_BASE_URL}posts/post/comment/${postId}/create/`, { text: commentText });
      setCommentText('');
      setComments(prev => [resp.data, ...prev]);
      setPost(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          comments_count: (prev.stats?.comments_count || 0) + 1,
        },
      }));
    } catch (e) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  // Delete post
  const deletePost = async () => {
    try {
      await axios.delete(`${API_BASE_URL}posts/post/${postId}/delete/`);
      router.back(); // Go back after deleting
    } catch (e) {
      Alert.alert('Error', 'Could not delete post');
    }
  };

  // Vote post
  const votePost = async (vote_type) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}posts/post/${postId}/vote/`, { vote_type });
      const { net_votes_count, vote_status } = resp.data;
      setPost(prev => ({
        ...prev,
        stats: { ...prev.stats, net_votes_count },
        status: { ...prev.status, vote_status },
      }));
    } catch (e) {}
  };

  // Media carousel
  const navigateMedia = (direction) => {
    const files = post?.media_files || post?.post?.media_files || [];
    setCurrentMediaIndex(idx => {
      if (direction === 'next' && idx < files.length - 1) return idx + 1;
      if (direction === 'prev' && idx > 0) return idx - 1;
      return idx;
    });
  };

  // --- Quoting (quote modal) ---
  const submitQuote = async () => {
    if (!post?.id || !quoteComment.trim()) return;
    try {
      const resp = await axios.post(`${API_BASE_URL}posts/post/${post.id}/quote/`, {
        quote_text: quoteText,
        quote_comment: quoteComment,
      });
      setShowQuoteModal(false);
      setQuoteComment('');
      setQuoteText('');
      router.push(`/timeline/${resp.data.id}`);
    } catch (e) {
      Alert.alert("Error", "Failed to quote");
    }
  };

  // --- Reposting (repost modal) ---
  const repostPostConfirmed = async () => {
    setRepostLoading(true);
    setRepostError('');
    setRepostSuccessId(null);
    try {
      const resp = await axios.post(`${API_BASE_URL}posts/post/${post.id}/repost/`);
      setRepostSuccessId(resp.data.id);
    } catch (e) {
      setRepostError('Already reposted, or error.');
    }
    setRepostLoading(false);
  };

  // Overlay/likes/dislikes
  const handleCloseLikesOverlay = () => {
    setShowLikesOverlay(false);
    setShowDislikesOverlay(false);
  };

  // --- Comments: like, reply, vote ---
  const toggleCommentLike = async (comment_id) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}posts/post/comment/${comment_id}/like/`);
      const { like_status, likes_count } = resp.data;
      setComments(prev =>
        prev.map(c =>
          c.id === comment_id
            ? { ...c, like_status, likes_count }
            : c
        )
      );
    } catch (e) {}
  };

  const voteComment = async (comment_id, vote_type) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}posts/post/comment/${comment_id}/vote/`, { vote_type });
      const { vote_status, net_votes_count } = resp.data;
      setComments(prev =>
        prev.map(c =>
          c.id === comment_id
            ? { ...c, vote_status, net_votes_count }
            : c
        )
      );
    } catch (e) {}
  };

  const replyToComment = async (comment_id) => {
    if (!commentReplyText.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}posts/post/comment/${comment_id}/reply/`, { text: commentReplyText });
      setCommentReplyText('');
      // Optionally refetch comments
    } catch (e) {}
  };

  // --- Value for provider ---
  const value = {
    post,
    setPost,
    postBookmarked,
    isSelfPost,
    commentText,
    setCommentText,
    commentReplyText,
    setCommentReplyText,
    comments,
    setComments,
    commentsLoading,
    commentsHasMore,
    showLikesOverlay,
    setShowLikesOverlay,
    showDislikesOverlay,
    setShowDislikesOverlay,
    currentMediaIndex,
    setCurrentMediaIndex,
    toggleLikeDislike,
    toggleBookmark,
    addComment,
    deletePost,
    votePost,
    voteComment,
    replyToComment,
    toggleCommentLike,
    navigateMedia,
    handleCloseLikesOverlay,
    showQuoteModal,
    setShowQuoteModal,
    quoteText,
    setQuoteText,
    quoteComment,
    setQuoteComment,
    showRepostModal,
    setShowRepostModal,
    repostLoading,
    repostError,
    repostSuccessId,
    repostPostConfirmed,
    submitQuote,
    router,
  };

  return (
    <ExpandPostContext.Provider value={value}>
      {children}
      {/* You can implement custom QuoteModal/RepostModal components using React Native's Modal or a library */}
    </ExpandPostContext.Provider>
  );
};

export const useExpandPostContext = () => useContext(ExpandPostContext);
