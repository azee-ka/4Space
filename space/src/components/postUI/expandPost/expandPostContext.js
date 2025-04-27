import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../../../utils/useApi';
import VideoPlayer from '../../videoPlayer/videoPlayer';

const ExpandPostContext = createContext();

export const ExpandPostProvider = ({ children, postId }) => {
    const { callApi } = useApi();

    // States managed by the PostProvider
    const [post, setPost] = useState(null); // Complete post data

    const [postBookmarked, setPostBookmarked] = useState(false);

    const [commentText, setCommentText] = useState(''); // Comment input
    const [commentReplyText, setCommentReplyText] = useState('');

    const [showLikesOverlay, setShowLikesOverlay] = useState(false);
    const [showDislikesOverlay, setShowDislikesOverlay] = useState(false);

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // Media navigation index

    // Fetch and set initial post data
    useEffect(() => {
        const fetchPostData = async () => {
            try {
                const response = await callApi(`posts/post/${postId}/`);
                setPost(response.data);
                console.log('Post data:', response.data);
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
            console.log(response.data);
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
            setCommentText('');
            setPost((prev) => ({
                ...prev,
                comments: [...prev.comments, response.data],
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

            console.log(response.data);
        } catch (error) {
            console.error('Error liking/unliking comment:', error);
        }
    };



    const voteComment = async (comment_id, vote_type) => {
        try {
            // Make the API request to upvote/downvote the comment
            const response = await callApi(`posts/post/comment/${comment_id}/vote/`, 'POST', { vote_type: vote_type });

            // Assuming response.data contains the updated vote status, upvotes count, and downvotes count
            const updatedVoteStatus = response.data.vote_status;
            const updatedUpvotesCount = response.data.upvotes_count;
            const updatedDownvotesCount = response.data.downvotes_count;

            // Manually update the post state to reflect the updated vote status and counts
            setPost((prevPost) => {
                const updatedComments = prevPost.comments.map((comment) => {
                    if (comment.id === comment_id) {
                        // Return updated comment data with updated vote status and counts
                        return {
                            ...comment,
                            vote_status: updatedVoteStatus,
                            upvotes_count: updatedUpvotesCount,
                            downvotes_count: updatedDownvotesCount
                        };
                    }
                    return comment;
                });

                return {
                    ...prevPost,
                    comments: updatedComments
                };
            });

            console.log(response.data);
        } catch (error) {
            console.error('Error voting comment:', error);
        }
    };


    const replyToComment = async (comment_id) => {
        try {
            const response = await callApi(`posts/post/comment/${comment_id}/reply/`, 'POST', { data: commentReplyText });
            // setPost(response.data);
            console.log(response.data);
        } catch (error) {
            console.error('Error voting comment:', error);
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
        voteComment,
        replyToComment,
        toggleCommentLike,
        navigateMedia,
        renderMediaContent,
        handleCloseLikesOverlay,
    };

    return <ExpandPostContext.Provider value={value}>{children}</ExpandPostContext.Provider>;
};

// Hook to use PostContext in components
export const useExpandPostContext = () => useContext(ExpandPostContext);
