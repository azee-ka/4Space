import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './timeline.css';
import apiUrl from '../../../utils/config';
import Post from './post';

const Timeline = ({ handleShowPostOverlay }) => {
    const [posts, setPosts] = useState([]);


    useEffect(() => {
        // Get the token from local storage
        const token = localStorage.getItem('token');

        // Check if the token exists
        if (token) {
            // Fetch explore page posts from your Django backend using Axios with the token in the headers
            axios.get(`${apiUrl}timeline/posts`, {
                headers: {
                    Authorization: `Token ${token}` // Include the token in headers for authentication
                }
            })
                .then(response => {
                    setPosts(response.data);
                })
                .catch(error => {
                    console.error('Error fetching explore page posts:', error);
                });
        }
    }, []);


    return (
        <div className="timeline-container">
            <p>Timeline</p>
            {posts.map((post) =>
                post.media !== null ? (
                    // Wrap each post with a Link to the ExpandedPost view
                    <Post postInfo={post} handleShowPostOverlay={handleShowPostOverlay} />

                ) : null
            )}
            <div className="timeline-right-side-container"></div>

        </div>
    );
};

export default Timeline;
