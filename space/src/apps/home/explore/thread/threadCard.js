import React from 'react';
import RenderText from '../../../../utils/autoCompleteInput/renderText';

const ThreadCard = ({ post }) => {
  return (
    <div className="post-card thread-card">
      <h4>{post.user.username}</h4>
      <RenderText text={post.content} />
      <small>{new Date(post.created_at).toLocaleString()}</small>
    </div>
  );
};

export default ThreadCard;
