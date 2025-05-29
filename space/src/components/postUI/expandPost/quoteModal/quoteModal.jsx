import React from 'react';
import ProfilePicture from '../../../../utils/profilePicture/getProfilePicture';
import RenderText from '../../../../utils/autoCompleteInput/renderText';

const QuoteModal = ({
    post,
    quoteText,
    quoteComment,
    setQuoteComment,
    onSubmit,
    onClose
}) => (
    <div className="quote-modal-overlay" onClick={onClose}>
        <div className="quote-modal" onClick={e => e.stopPropagation()}>
            <h3>Quote Post</h3>
            <div className="quote-modal-header">
                <div className="quote-modal-user">
                    <ProfilePicture src={post?.author?.profile_image} />
                    <span className="quote-modal-username">@{post?.author?.username}</span>
                </div>
            </div>
            <div className="quote-modal-quote">
                <RenderText text={quoteText || ""} />
            </div>
            <textarea
                className="quote-modal-textarea"
                value={quoteComment}
                onChange={e => setQuoteComment(e.target.value)}
                placeholder="Add your comment..."
                maxLength={400}
                autoFocus
            />
            <div className="quote-modal-actions">
                <button
                    className="quote-modal-submit-btn"
                    onClick={onSubmit}
                    disabled={!quoteComment.trim()}
                >
                    Post Quote
                </button>
                <button
                    className="quote-modal-cancel-btn"
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

export default QuoteModal;
