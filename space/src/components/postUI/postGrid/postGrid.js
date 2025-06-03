// personalProfile.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './postGrid.css';

import { FaBoxes, FaFile, FaLayerGroup, FaStackExchange, FaTh, FaVideo } from 'react-icons/fa';
import ImageWrapper from '../../../utils/imageWrapper/imageWrapper';

const PostsGrid = ({ classname, postsData, handleExpandPostOpen }) => {
  const navigate = useNavigate();

  const [posts, setPosts] = useState(postsData);

  useEffect(() => {
    setPosts(postsData);
  }, [postsData]);

  const handlePostClick = (post, index) => {
    handleExpandPostOpen(post.id, posts, window.location.pathname + window.location.hash, index, post.post_type);
  };


  return (posts !== undefined || posts !== null) ? (
    posts.length > 0 ? (
      <div className='post-for-grid'>
        {posts.map((post, index) => (
          <div className='per-post-grid' key={index} onClick={() => handlePostClick(post, index)}>
            <div className='grid-per-post' >
              <ImageWrapper src={post?.thumbnail?.file} />
            </div>
            <div className='post-thumbnail-container'>
              <div className='thumbnail-icon'>
                {post?.media_files_count > 1 ? (
                  <FaLayerGroup />
                ) : (
                  post?.thumbnail?.media_type === 'video' && <FaVideo />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className='no-posts-grid'>
        No Posts to Show!
      </div>
    )
  ) : (
    <div>Loading...</div>
  )
}

export default PostsGrid;