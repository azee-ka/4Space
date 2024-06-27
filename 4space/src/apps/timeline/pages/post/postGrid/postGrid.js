import React from "react";
import './postGrid.css';
import API_BASE_URL from "../../../../../general/components/Authentication/utils/apiConfig";
import { useNavigate } from "react-router-dom";

const PostsGrid = ({ posts, handleExpandPostTrigger}) => {
    const navigate = useNavigate();

    console.log(posts);

    const handlePostClick = (post) => {
        const post_id = post.id;
        const nextPostId = post.next_post_uuid;
        const prevPostId = post.previous_post_uuid;
        console.log('tgrigger')

        handleExpandPostTrigger(post, window.location.pathname);
        window.history.replaceState(null, '', `/post/${post_id}`);
    };

    return posts ? (
        <div className='post-grid'>
            <div className="post-grid-inner">
                {posts.map((post) => (
                    post.media_files.file && (
                        <div className='post-item' key={post.id} onClick={() => handlePostClick(post)}>
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
