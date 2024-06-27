import React from "react";
import './postGrid.css';
import API_BASE_URL from "../../../../../general/components/Authentication/utils/apiConfig";
import { useNavigate } from "react-router-dom";

const PostsGrid = ({ posts, handleExpandPostTrigger}) => {

    return posts ? (
        <div className='post-grid'>
            <div className="post-grid-inner">
                {posts.map((post) => (
                    post.media_files.file && (
                        <div className='post-item' key={post.id} onClick={() => handleExpandPostTrigger(post, window.location.pathname)}>
                            <img src={`${API_BASE_URL}${post.media_files.file}`} alt={`Post ${post.id}`} />
                        </div>
                    )
                ))}
            </div>
        </div>
    ) : (
        <div>Loading...</div>
    )  
};

export default PostsGrid;
