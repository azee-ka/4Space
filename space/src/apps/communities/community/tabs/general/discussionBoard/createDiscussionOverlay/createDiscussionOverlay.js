import React, { useState, useRef } from 'react';
import './createDiscussionOverlay.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import CustomEditor from '../../../../../../../utils/editor/editor';
import EmojiButton from '../../../../../../../utils/editor/EmojiButton';

import { useCommunity } from '../../../../../../../context/CommunityContext'; // Import context

const CreateDiscussionOverlay = ({ communityId, onClose, onPostCreated }) => {
    const [titleContent, setTitleContent] = useState('');
    const [bodyContent, setBodyContent] = useState('');
    // const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { exchange } = useCommunity(); // Access the exchange logic

const { createDiscussionMutation } = exchange;
const { mutate: createDiscussion, isLoading } = createDiscussionMutation;

    // Each editor has its own ref to track insertEmoji per instance
    const titleInsertEmojiRef = useRef(null);


    const handleSubmit = () => {
    const plainTitle = titleContent.replace(/<[^>]+>/g, '').trim();
    const plainBody  = bodyContent.replace(/<[^>]+>/g, '').trim();
    if (!plainTitle || !plainBody) return;
    if (plainTitle.length > 255) {
      return alert('Title must be 255 characters or less.');
    }

    createDiscussion(
      { title: titleContent, content: bodyContent },
      {
        onSuccess: (newPost) => {
          // first close the overlay
          onClose();

          // then notify parent that a new post was created
          if (onPostCreated) {
            onPostCreated(newPost);
          }
        },
        onError: (err) => {
          setError(err?.response?.data?.detail || err.message || 'Failed to post.');
        },
      }
    );
  };

    return (
        <div className="discussion-overlay-backdrop" onClick={onClose}>
            <div className="discussion-overlay-card" onClick={(e) => e.stopPropagation()}>
                <button className="overlay-close-btn" onClick={onClose}>
                    <FontAwesomeIcon icon={faXmark} />
                </button>

                <div className="overlay-header">
                    <h2 className="overlay-heading">Start a Discussion</h2>
                </div>

                <div className="title-section">
                    <label className="editor-label">
                        Title
                        <span className="char-counter">{titleContent.replace(/<[^>]+>/g, '').length}/255</span>
                    </label>

                    <div className="title-editor-block">
                        <input
                            type="text"
                            className="title-input"
                            value={titleContent}
                            onChange={(e) => setTitleContent(e.target.value)}
                            placeholder="e.g. How do I optimize React rendering?"
                            maxLength={255}
                        />
                        {/* You can bring back the rich title editor if needed */}
                    </div>
                </div>

                <div className="body-section">
                    <label className="editor-label">Content</label>
                    <CustomEditor
                        id="content-editor"
                        content={bodyContent}
                        onContentChange={setBodyContent}
                        placeholder="Explain your idea, question, or thought..."
                        isOverlay={true}
                        showToolbar={true}
                        isPlainText={false}
                        supportMedia={true}
                        onImageUpload={() => { }} // or provide handler
                    />
                </div>

                <div className="overlay-actions">
                    <button
                        className="submit-discussion-btn"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Posting...' : 'Post Discussion'}
                    </button>
                    {error && (
                        <div className="discussion-form-error">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateDiscussionOverlay;
