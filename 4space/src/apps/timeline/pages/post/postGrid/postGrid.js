import React from "react";
import './postGrid.css';
import API_BASE_URL from "../../../../../general/components/Authentication/utils/apiConfig";
import { useNavigate } from "react-router-dom";
import MediaViewer from "../../../../../general/utils/mediaViewer/mediaViewer";

const PostsGrid = ({ posts, handleExpandPostTrigger}) => {

    console.log(posts);

    return posts ? (
        <div className='post-grid'>
            <div className="post-grid-inner">
                {posts.map((post, index) => (
                    post.media_files.file && (
                        <div className='post-item' key={post.id} onClick={() => handleExpandPostTrigger(post.id, posts, index, window.location.pathname)}>
                            {/* <img src={`${API_BASE_URL}${post.media_files.file}`} alt={`Post ${post.id}`} /> */}
                            <MediaViewer src={post.media_files.file} mediaType={post.media_files.media_type} />
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
