import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../../../utils/useApi';
import VideoPlayer from '../../videoPlayer/videoPlayer';
import { useAuth } from '../../../hooks/useAuth';
import { usePaginatedList } from '../../../hooks/usePaginatedList';

const ExpandPostContext = createContext();

export const ExpandPostProvider = ({ children, postId }) => {
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




    const fetchCommentsPage = async ({ page, pageSize }) => {
        if (!postId) return { results: [], next: null, count: 0 };
        const offset = page * pageSize;
        const url = `posts/post/${postId}/comments/?limit=${pageSize}&offset=${offset}`;
        const resp = await callApi(url, 'GET');
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
                stats: { likes_count, dislikes_count },
                status: { like_status, dislike_status },
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

    // Add a comment
    const addComment = async () => {
        if (!commentText.trim()) return; // Prevent empty comments
        try {
            const formData = new FormData();
            formData.append('text', commentText);
            formData.append('post_id', postId);

            const response = await callApi(`posts/post/comment/${postId}/create/`, 'POST', formData);

            // Optimistically update post state
            setCommentText('');
            setPost((prev) => {
                // Compute new comments count
                const newCommentsCount = (prev.stats?.comments_count || 0) + 1;
                return {
                    ...prev,
                    comments: [...prev.comments, response.data],
                    stats: {
                        ...prev.stats,
                        comments_count: newCommentsCount,
                    },
                };
            });
            resetComments(); // Reload comments, will fetch first page again
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

            // Manually update the post state to reflect the updated like status and count
            setPost((prevPost) => {
                const updatedComments = prevPost.comments.map((comment) => {
                    if (comment.id === comment_id) {
                        // Return updated comment data with updated like status and likes count
                        return {
                            ...comment,
                            like_status: updatedLikeStatus,
                            likes_count: updatedLikesCount
                        };
                    }
                    return comment;
                });

                return {
                    ...prevPost,
                    comments: updatedComments
                };
            });

            setComments(prevComments => prevComments.map(comment =>
                comment.id === comment_id
                    ? { ...comment, like_status: updatedLikeStatus, likes_count: updatedLikesCount }
                    : comment
            ));
            // console.log(response.data);
        } catch (error) {
            console.error('Error liking/unliking comment:', error);
        }
    };



    const voteComment = async (comment_id, vote_type) => {
        // 1. Optimistically update comment UI immediately
        setPost((prevPost) => {
            const updatedComments = prevPost.comments.map((comment) => {
                if (comment.id === comment_id) {
                    // Calculate the new net_votes_count optimistically
                    let netVotes = comment.net_votes_count || 0;
                    let previousStatus = comment.vote_status;
                    let newStatus = previousStatus;
                    // Simulate the netVotes change based on the previous and new action
                    if (vote_type === 'upvote') {
                        if (previousStatus === 'upvoted') {
                            // Undo upvote
                            netVotes -= 1;
                            newStatus = 'none';
                        } else if (previousStatus === 'downvoted') {
                            // Downvote to upvote (+2)
                            netVotes += 2;
                            newStatus = 'upvoted';
                        } else {
                            // New upvote
                            netVotes += 1;
                            newStatus = 'upvoted';
                        }
                    } else if (vote_type === 'downvote') {
                        if (previousStatus === 'downvoted') {
                            // Undo downvote
                            netVotes += 1;
                            newStatus = 'none';
                        } else if (previousStatus === 'upvoted') {
                            // Upvote to downvote (-2)
                            netVotes -= 2;
                            newStatus = 'downvoted';
                        } else {
                            // New downvote
                            netVotes -= 1;
                            newStatus = 'downvoted';
                        }
                    }
                    return {
                        ...comment,
                        net_votes_count: netVotes,
                        vote_status: newStatus
                    };
                }
                return comment;
            });

            return {
                ...prevPost,
                comments: updatedComments
            };
        });

        // 2. Then send the request to backend and update to real values on response
        try {
            const response = await callApi(`posts/post/comment/${comment_id}/vote/`, 'POST', { vote_type });
            // Backend should return net_votes_count and vote_status
            const { vote_status, net_votes_count } = response.data;

            setPost((prevPost) => {
                const updatedComments = prevPost.comments.map((comment) =>
                    comment.id === comment_id
                        ? { ...comment, net_votes_count, vote_status }
                        : comment
                );
                return { ...prevPost, comments: updatedComments };
            });
            setComments(prevComments => prevComments.map(comment =>
                comment.id === comment_id
                    ? { ...comment, net_votes_count, vote_status }
                    : comment
            ));
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
    };

    return <ExpandPostContext.Provider value={value}>{children}</ExpandPostContext.Provider>;
};

// Hook to use PostContext in components
export const useExpandPostContext = () => useContext(ExpandPostContext);
