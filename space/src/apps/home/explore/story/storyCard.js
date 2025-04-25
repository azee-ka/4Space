import React from 'react';

const StoryCard = ({ post }) => {
  return (
    <div className="post-card story-card">
      <p>{post.content}</p>
      <small>{new Date(post.created_at).toLocaleDateString()}</small>
    </div>
  );
};

export default StoryCard;
