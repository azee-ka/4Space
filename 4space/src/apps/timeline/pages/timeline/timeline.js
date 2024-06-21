import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './timeline.css';
import API_BASE_URL from '../../../../config';
import Post from './post';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import GetConfig from '../../../../general/components/Authentication/utils/config';

const Timeline = ({ handleShowPostOverlay }) => {
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        // Fetch explore page posts from your Django backend using Axios with the token in the headers
        axios.get(`${API_BASE_URL}api/post/timeline/posts/`, config)
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
                <p>Timeline</p>
                {posts.map((post, index) =>
                    post.media !== null ? (
                        // Wrap each post with a Link to the ExpandedPost view
                        <Post
                            key={index}
                            postInfo={post}
                            handleShowPostOverlay={handleShowPostOverlay}
                        />
                    ) : null
                )}
            </div>
            <div className="timeline-right-side-container"></div>

        </div>
    );
};

export default Timeline;
