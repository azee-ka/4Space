import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useApi from "../../utils/useApi";
import Thread from "./thread/thread";
import Visual from "./visual/visual";

const Post = () => {
    const { posdId } = useParams();
    const { callApi } = useApi();

    const [postType, setPostType] = useState();

    const getPosts = async () => {
        try {
            const response = await callApi('posts/post/get-posts/'); // Replace '/api/posts' with your API endpoint
            console.log('Post retrieved successfully:', response.data);
        } catch (error) {
            console.error('Error retrieving post:', error);
        }
    };

    useEffect(() => {
        getPosts();
    }, []);

    return postType === "Thread" ? (
        <Thread />
    ) : (
        <Visual />
    )
};

export default Post;