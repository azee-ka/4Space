import React from 'react';

const PollCard = ({ post }) => {
  return (
    <div className="post-card poll-card">
      <h4>{post.question}</h4>
      <ul>
        {post.options.map((option, index) => (
          <li key={index}>{option}</li>
        ))}
      </ul>
      <small>Expires: {new Date(post.expiration_date).toLocaleDateString()}</small>
    </div>
  );
};

export default PollCard;
