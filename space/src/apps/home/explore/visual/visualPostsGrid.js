import React, { useState } from 'react';
import './visualPostsGrid.css';
import PostsGrid from '../../../../components/postUI/postGrid/postGrid';
import { usePostContext } from '../../../../context/PostContext';

const VisualPostsGrid = ({ posts }) => {
  const { handleExpandPostOpen } = usePostContext();

  return (
    <div className="visual-posts-grid">
      <PostsGrid classname={'explore'} postsData={posts} handleExpandPostOpen={handleExpandPostOpen} />
    </div>
  );
};

export default VisualPostsGrid;
