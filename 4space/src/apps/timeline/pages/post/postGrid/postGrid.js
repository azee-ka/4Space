import React from "react";
import './postGrid.css';
import API_BASE_URL from "../../../../../general/components/Authentication/utils/apiConfig";
import { useNavigate } from "react-router-dom";

const PostsGrid = ({ posts, handleShowExpandedOverlayPost}) => {
    const navigate = useNavigate();

    console.log(posts);

    const handlePostClick = (post_id) => {
        const currentIndex = posts.findIndex(post => post.id === post_id);
        const nextPostId = currentIndex < posts.length - 1 ? posts[currentIndex + 1].id : null;
        const prevPostId = currentIndex > 0 ? posts[currentIndex - 1].id : null;


        handleShowExpandedOverlayPost(post_id, window.location.pathname, prevPostId, nextPostId);
        window.history.replaceState(null, '', `/post/${post_id}`);
    };

    return posts ?  (
        <div className='post-grid'>
            <div className="post-grid-inner">
                {posts.map((post) => (
                    post.media_files.file && (
                        <div className='post-item' key={post.id} onClick={() => handlePostClick(post.id)}>
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
