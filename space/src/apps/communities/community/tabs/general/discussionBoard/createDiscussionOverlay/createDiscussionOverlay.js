import React, { useState } from 'react';
import './createDiscussionOverlay.css';
import useApi from '../../../../../../../utils/useApi';

const CreateDiscussionOverlay = ({ communityId, onClose, onPostCreated }) => {
  const { callApi } = useApi();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const response = await callApi(`discussion/${communityId}/`, 'POST', { title, content });
      onPostCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Post failed:', err);
    }
    setLoading(false);
  };

  return (
    <div className="discussion-overlay-backdrop" onClick={onClose}>
      <div className="discussion-overlay-card" onClick={(e) => e.stopPropagation()}>
        <button className="overlay-close-btn" onClick={onClose}>×</button>
        <h2>Create Discussion</h2>
        <input
          type="text"
          placeholder="Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className="submit-discussion-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Posting...' : 'Post Discussion'}
        </button>
      </div>
    </div>
  );
};

export default CreateDiscussionOverlay;
