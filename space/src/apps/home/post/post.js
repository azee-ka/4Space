import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useApi from "../../../utils/useApi";
import ThreadPost from "../../../components/postUI/threadPost/threadPost";
import ExpandPost from "../../../components/postUI/expandPost/expandPost";
import { ExpandPostProvider } from "../../../components/postUI/expandPost/expandPostContext";
import { usePostContext } from "../../../context/PostContext";

const Post = () => {
    const {
        expandPostIdReciever: overlayPostId,
    } = usePostContext();
    const { postId } = useParams();
    const { callApi } = useApi();

    const [postType, setPostType] = useState(null);

    const getPost = async (post_id) => {
        try {
            const response = await callApi(`posts/post/${post_id}/type/`);
            // console.log('Post type retrieved successfully:', response.data,);
            setPostType(response.data.post_type);
        } catch (error) {
            console.error('Error retrieving post:', error);
        }
    };

    useEffect(() => {
        if (postId || overlayPostId) {
            getPost(overlayPostId ? overlayPostId : postId);
        }
    }, [postId]);

    // console.log('Post type:', postType, postId, overlayPostId);


    return postType === "Thread" ? (
        <ExpandPostProvider postId={postId}>
            <ThreadPost />
        </ExpandPostProvider>

    ) : postType === "Visual" ? (
        <ExpandPost />
    ) : (
        <div>Loading...</div>
    )
};

export default Post;