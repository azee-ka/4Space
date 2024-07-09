import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './timeflow.css';
import API_BASE_URL from '../../../../config';
import Post from './post';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import GetConfig from '../../../../general/components/Authentication/utils/config';

const Timeflow = ({ handleUserListTrigger, handleExpandPostTrigger }) => {
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [posts, setPosts] = useState([]);

    const handleFetchTimeFlowPosts = async () => {
        // Fetch explore page posts from your Django backend using Axios with the token in the headers
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/timeline/timeline/posts/`, config);
            setPosts(response.data);
            console.log(response.data);
        } catch (error) {
            console.error('Error fetching timeline page posts:', error);
        }
    };

    useEffect(() => {
        handleFetchTimeFlowPosts();
    }, []);


    return posts ? (
        <div className="timeline-container">
            <div className="timeline-container-inner">
                <div className='timeline-page-header'>
                    <div className='timeline-page-header-inner'>
                        <h2>TimeFlow</h2>
                    </div>
                </div>
                {posts.map((post, index) =>
                    post.media !== null ? (
                        // Wrap each post with a Link to the ExpandedPost view
                        <Post
                            key={index}
                            postId={post.id}
                            posts={posts}
                            currentPostIndex={index}
                            handleExpandPostTrigger={handleExpandPostTrigger}
                            handleUserListTrigger={handleUserListTrigger}
                        />
                    ) : null
                )}
            </div>
        </div>
    ) : (
        <div>Loading...</div>
    )
};

export default Timeflow;
