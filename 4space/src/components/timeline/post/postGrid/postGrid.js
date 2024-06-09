import React from "react";
import './postGrid.css';
import API_BASE_URL from "../../../../config";
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

    return (
        <div className='post-grid'>
            <div className="post-grid-inner">
                {posts.map((post) => (
                    <div className='post-item' key={post.id} onClick={() => handlePostClick(post.id)}>
                        <img src={`${API_BASE_URL}${post.media_files.file}`} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PostsGrid;
