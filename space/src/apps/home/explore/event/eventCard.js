import React from 'react';

const EventCard = ({ post }) => {
  return (
    <div className="post-card event-card">
      <h4>{post.title}</h4>
      <small>Event Date: {new Date(post.event_date).toLocaleDateString()}</small>
    </div>
  );
};

export default EventCard;
