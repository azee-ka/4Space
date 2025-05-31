import React, { useState, useRef } from 'react';
import './createDiscussionOverlay.scss';
import useApi from '../../../../../../../utils/useApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import CustomEditor from '../../../../../../../utils/editor/editor';
import EmojiButton from '../../../../../../../utils/editor/EmojiButton';

const CreateDiscussionOverlay = ({ communityId, onClose, onPostCreated }) => {
    const { callApi } = useApi();
    const [titleContent, setTitleContent] = useState('');
    const [bodyContent, setBodyContent] = useState('');
    const [loading, setLoading] = useState(false);

    // Each editor has its own ref to track insertEmoji per instance
    const titleInsertEmojiRef = useRef(null);

    const handleSubmit = async () => {
        const strippedTitle = titleContent.replace(/<[^>]+>/g, '').trim();
        const strippedBody = bodyContent.replace(/<[^>]+>/g, '').trim();

        if (strippedTitle.length > 255) {
    alert("Title must be 255 characters or less.");
    return;
}

        if (!strippedTitle || !strippedBody) return;

        setLoading(true);
        try {
            const response = await callApi(`community/${communityId}/exchanges/create/`, 'POST', {
                title: titleContent,
                content: bodyContent,
            });
            onPostCreated(response.data);
            console.log(response.data);
            onClose();
        } catch (err) {
            console.error('Post failed:', err);
        } finally {
            setLoading(false);
        }
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

                        {/* <CustomEditor
                            id="title-editor"
                            content={titleContent}
                            onContentChange={setTitleContent}
                            placeholder="e.g. How do I optimize React rendering?"
                            showToolbar={false}
                            isPlainText={true}
                            isOverlay={true}
                            supportMedia={false}
                            ref={(ref) => (titleInsertEmojiRef.current = ref?.insertEmoji)}
                        /> */}
                        {/* <EmojiButton onEmojiSelect={(emoji) => titleInsertEmojiRef.current?.(emoji)} /> */}
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
                        disabled={loading}
                    >
                        {loading ? 'Posting...' : 'Post Discussion'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateDiscussionOverlay;
