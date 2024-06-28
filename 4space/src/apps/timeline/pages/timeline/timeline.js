import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './timeline.css';
import API_BASE_URL from '../../../../config';
import Post from './post';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import GetConfig from '../../../../general/components/Authentication/utils/config';

const Timeline = ({ handleUserListTrigger, handleExpandPostTrigger }) => {
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        // Fetch explore page posts from your Django backend using Axios with the token in the headers
        axios.get(`${API_BASE_URL}api/apps/timeline/timeline/posts/`, config)
            .then(response => {
                setPosts(response.data);
                console.log(response.data);
            })
            .catch(error => {
                console.error('Error fetching explore page posts:', error);
            });
    }, []);


    return (
        <div className="timeline-container">
            <div className="timeline-container-inner">
                <div className='timeline-page-header'>
                    <div className='timeline-page-header-inner'>
                        <h2>Timeline</h2>
                    </div>
                </div>
                {posts.map((post, index) =>
                    post.media !== null ? (
                        // Wrap each post with a Link to the ExpandedPost view
                        <Post
                            key={index}
                            postId={post.id}
                            handleExpandPostTrigger={handleExpandPostTrigger}
                            handleUserListTrigger={handleUserListTrigger}
                        />
                    ) : null
                )}
            </div>
        </div>
    );
};

export default Timeline;
