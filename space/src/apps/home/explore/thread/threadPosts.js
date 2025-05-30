import React from "react";
import "./threadPosts.css";

const ThreadPostCard = ({ post, onClick }) => {
  console.log(post);
  return (
  <div
    className="thread-post-card"
    onClick={onClick}
    tabIndex={0}
    role="button"
    style={{ cursor: "pointer" }}
  >
    <div className="thread-avatar-row">
      <img
        className="thread-avatar"
        src={post?.author?.profile_image}
        alt={post?.author?.username}
      />
      <span className="thread-username">@{post?.author?.username}</span>
    </div>
    <div className="thread-post-content">{post.content}</div>
  </div>
);
}

export default ThreadPostCard;