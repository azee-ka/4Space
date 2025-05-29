import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../../../utils/useApi';
import VideoPlayer from '../../videoPlayer/videoPlayer';
import { useAuth } from '../../../hooks/useAuth';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import RenderText from '../../../utils/autoCompleteInput/renderText';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { useNavigate } from 'react-router-dom';
import { FaRetweet } from 'react-icons/fa';
import './repostModal/repostModal.css';
import QuoteModal from './quoteModal/quoteModal';
import RepostModal from './repostModal/repostModal';


const ExpandPostContext = createContext();

export const ExpandPostProvider = ({ children, postId }) => {
    const navigate = useNavigate();
    const { callApi } = useApi();
    const { authState } = useAuth();

    // States managed by the PostProvider
    const [post, setPost] = useState(null); // Complete post data

    const [postBookmarked, setPostBookmarked] = useState(false);

    const [commentText, setCommentText] = useState(''); // Comment input
    const [commentReplyText, setCommentReplyText] = useState('');

    const [showLikesOverlay, setShowLikesOverlay] = useState(false);
    const [showDislikesOverlay, setShowDislikesOverlay] = useState(false);

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // Media navigation index

    const [isSelfPost, setIsSelfPost] = useState(false);




    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteText, setQuoteText] = useState('');
    const [quoteComment, setQuoteComment] = useState('');

    const [showQuoteBtn, setShowQuoteBtn] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [btnPos, setBtnPos] = useState(null); // {top, left}
    const [quoteSourceRef, setQuoteSourceRef] = useState(null); // To track which contentRef to listen to

    const [showRepostModal, setShowRepostModal] = useState(false);
    const [repostLoading, setRepostLoading] = useState(false);
    const [repostError, setRepostError] = useState('');
    const [repostSuccessId, setRepostSuccessId] = useState(null); // Stores the ID of the new repost

    const repostPostConfirmed = async () => {
        setRepostLoading(true);
        setRepostError('');
        setRepostSuccessId(null);
        try {
            const res = await callApi(`posts/post/${post.id}/repost/`, 'POST');
            console.log(res.data)
            setRepostSuccessId(res.data.id); // Store new repost ID for "Go to repost"
            // Optionally, update local repost counters here
        } catch (e) {
            console.error('Error reposting', e);
            setRepostError(e?.response?.data?.error || "Already reposted, or error.");
        }
        setRepostLoading(false);
    };


    const handleSelection = (contentRef) => (e) => {
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
    };



    const repostPost = async () => {
        if (!post?.id) return;
        try {
            const res = await callApi(`posts/post/${post.id}/repost/`, 'POST');
            // increment reposts counter or navigate to new repost

            console.log(res.data);
            navigate(`/posts/p/${res.data.id}`); // If you want to go to new repost page
            // Or show a success toast/snackbar
        } catch (e) {
            console.error("Error reposting", e);
        }
    };


    const submitQuote = async () => {
        if (!post?.id || !quoteComment.trim()) return;
        try {
            const res = await callApi(`posts/post/${post.id}/quote/`, 'POST', {
                quote_text: quoteText,
                quote_comment: quoteComment
            });
            console.log(res.data);
            setShowQuoteModal(false);
            setQuoteComment('');
            setQuoteText('');
            navigate(`/posts/p/${res.data.id}`)
        } catch (e) {
            alert("Failed to quote");
        }
    };



    const fetchCommentsPage = async ({ page, pageSize }) => {
        if (!postId) return { results: [], next: null, count: 0 };
        const offset = page * pageSize;
        const url = `posts/post/${postId}/comments/?limit=${pageSize}&offset=${offset}`;
        const resp = await callApi(url, 'GET');
        // console.log(resp);
        return resp.data; // DRF paginated format: { results, next, count }
    };

    const {
        items: comments,
        loadMore: loadMoreComments,
        hasMore: commentsHasMore,
        loading: commentsLoading,
        totalCount: commentsTotalCount,
        reset: resetComments,
        setItems: setComments,
        setTotalCount,           // Add this!
    } = usePaginatedList(fetchCommentsPage, { pageSize: 20, immediate: true, resetDeps: [postId] });




    useEffect(() => {
        setIsSelfPost(post?.author?.username === authState?.user?.username);
    }, [post, authState]);

    // Fetch and set initial post data
    useEffect(() => {
        const fetchPostData = async () => {
            try {
                const response = await callApi(`posts/post/${postId}/`);
                setPost(response.data);
                // console.log('Post data:', response.data);
            } catch (error) {
                console.error('Error fetching post data:', error);
            }
        };

        if (postId) {
            fetchPostData();
        }
    }, [postId]);



    const toggleLikeDislike = async (toggle_type) => {
        try {
            // Make a POST request to the new combined endpoint
            const response = await callApi(`posts/post/${postId}/toggle-like-dislike/`, 'POST', { toggle_type: toggle_type });
            // console.log(response.data);
            // Get updated like/dislike counts and user statuses
            const { likes_count, dislikes_count, like_status, dislike_status } = response.data;

            // Update the post with the new like/dislike counts and user statuses
            setPost((prevPost) => ({
                ...prevPost,
                stats: {
                    ...prevPost.stats,
                    likes_count,
                    dislikes_count,
                },
                status: {
                    ...prevPost.status,
                    like_status,
                    dislike_status,
                },
            }));

        } catch (error) {
            console.error('Error toggling like/dislike:', error);
        }
    };



    const toggleBookmark = async () => {
        try {
            const method = post?.status?.like_status === 'liked' ? 'DELETE' : 'POST';
            // const response = await callApi(`radianspace/flare/${postId}/dislike/`, method);
            setPostBookmarked(!postBookmarked);
            // setPost(response.data);
        } catch (err) {
            console.error('Error toggling bookmark:', err);
        }
    };

    // Add comment function:
    const addComment = async () => {
        if (!commentText.trim()) return;
        try {
            const formData = new FormData();
            formData.append('text', commentText);
            formData.append('post_id', postId);

            const response = await callApi(`posts/post/comment/${postId}/create/`, 'POST', formData);

            setCommentText('');

            setComments(prev => [response.data, ...prev]);
            setTotalCount(c => c + 1);   // <----- THIS LINE IS CRITICAL!

            // Optionally, update the post stats (for post.stats.comments_count):
            setPost(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    comments_count: (prev.stats?.comments_count || 0) + 1,
                },
            }));
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };



    // Delete the post
    const deletePost = async () => {
        try {
            await callApi(`posts/post/${postId}/delete/`, 'DELETE');
            // window.location.reload();
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };



    const toggleCommentLike = async (comment_id) => {
        try {
            // Make the API request to like/unlike the comment
            const response = await callApi(`posts/post/comment/${comment_id}/like/`, 'POST');

            // Assuming response.data contains the updated like status and likes count
            const updatedLikeStatus = response.data.like_status;
            const updatedLikesCount = response.data.likes_count;

            setComments(prevComments =>
                prevComments.map(comment =>
                    comment.id === comment_id
                        ? { ...comment, like_status: updatedLikeStatus, likes_count: updatedLikesCount }
                        : comment
                )
            );
            // console.log(response.data);
        } catch (error) {
            console.error('Error liking/unliking comment:', error);
        }
    };



    const voteComment = async (comment_id, vote_type) => {
        // 1. Send the request to backend and update to real values on response
        try {
            const response = await callApi(`posts/post/comment/${comment_id}/vote/`, 'POST', { vote_type });
            // Backend should return net_votes_count and vote_status
            const { vote_status, net_votes_count } = response.data;

            setComments(prevComments =>
                prevComments.map(comment =>
                    comment.id === comment_id
                        ? { ...comment, net_votes_count, vote_status }
                        : comment
                )
            );
        } catch (error) {
            // Optionally: rollback optimistic update or show error
            // (For now, you might just log)
            console.error('Error voting comment:', error);
        }
    };


    const replyToComment = async (comment_id) => {
        try {
            const response = await callApi(`posts/post/comment/${comment_id}/reply/`, 'POST', { data: commentReplyText });
            // setPost(response.data);
            // console.log(response.data);
            setCommentReplyText('');
        } catch (error) {
            console.error('Error voting comment:', error);
        }
    };



    const votePost = async (vote_type) => {
        try {
            const response = await callApi(`posts/post/${postId}/vote/`, 'POST', { vote_type });
            const { net_votes_count, vote_status } = response.data;

            setPost(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    net_votes_count,
                },
                status: {
                    ...prev.status,
                    vote_status,
                },
            }));
        } catch (error) {
            console.error('Error voting post:', error);
        }
    };




    // Navigate media
    const navigateMedia = (direction) => {
        if (!post?.post?.media_files) return;
        setCurrentMediaIndex((prevIndex) => {
            const maxIndex = post?.post?.media_files.length - 1;
            if (direction === 'next' && prevIndex < maxIndex) return prevIndex + 1;
            if (direction === 'prev' && prevIndex > 0) return prevIndex - 1;
            return prevIndex;
        });
    };

    // Render media content
    const renderMediaContent = () => {
        const mediaFile = post?.post?.media_files?.[currentMediaIndex];
        // console.log(mediaFile);
        if (!mediaFile) return null;

        if (mediaFile.media_type === 'video') {
            return <VideoPlayer mediaFile={mediaFile} />;
        } else {
            return <img src={`${mediaFile.file}`} alt={mediaFile.id} />;
        }
    };

    const handleCloseLikesOverlay = () => {
        setShowLikesOverlay(false);
        setShowDislikesOverlay(false);
    }



    // Context value
    const value = {
        post,
        setPost,
        postBookmarked,
        commentText,
        commentReplyText,
        showLikesOverlay,
        showDislikesOverlay,
        currentMediaIndex,
        setCommentText,
        setCommentReplyText,
        setShowLikesOverlay,
        setShowDislikesOverlay,
        toggleLikeDislike,
        toggleBookmark,
        addComment,
        deletePost,
        votePost,
        voteComment,
        replyToComment,
        toggleCommentLike,
        navigateMedia,
        renderMediaContent,
        handleCloseLikesOverlay,
        isSelfPost,

        comments,
        loadMoreComments,
        commentsHasMore,
        commentsLoading,
        commentsTotalCount,
        resetComments,

        showQuoteModal,
        setShowQuoteModal,
        quoteText,
        setQuoteText,
        handleSelection,
        showQuoteBtn,
        setShowQuoteBtn,
        btnPos,
        setBtnPos,
        selectedText,
        setSelectedText,

        setShowRepostModal,
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
                    onConfirm={repostPostConfirmed}
                />
            )}
        </ExpandPostContext.Provider>
    )
};

// Hook to use PostContext in components
export const useExpandPostContext = () => useContext(ExpandPostContext);
