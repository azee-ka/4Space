import React from 'react';
import ProfilePicture from '../../../../utils/profilePicture/getProfilePicture';
import RenderText from '../../../../utils/autoCompleteInput/renderText';
import { FaRetweet } from 'react-icons/fa';

const RepostModal = ({
    post,
    repostError,
    repostLoading,
    repostSuccessId,
    onGoToRepost,
    onClose,
    onConfirm,
}) => (
    <div className="repost-modal__backdrop" onClick={onClose}>
        <div className="repost-modal__container" onClick={e => e.stopPropagation()} tabIndex={-1}>
            <div className="repost-modal__header">
                <FaRetweet className="repost-modal__icon" />
                <span>Repost this post?</span>
            </div>
            <div className="repost-modal__preview">
                <div className="repost-modal__profile">
                    <ProfilePicture src={post?.author?.profile_image} className="repost-modal__avatar" />
                </div>
                <div className="repost-modal__body">
                    <span className="repost-modal__username">@{post?.author?.username}</span>
                    {post?.quote_text && (
                        <div className="repost-modal__quote-block">
                            <div className="repost-modal__quote-bar" />
                            <span className="repost-modal__quote-text">{post.quote_text}</span>
                        </div>
                    )}
                    {post?.quote_comment && (
                        <div className="repost-modal__quote-comment">{post.quote_comment}</div>
                    )}
                    {(!post?.quote_text && !post?.quote_comment) && (
                        <div className="repost-modal__content">
                            {post?.post?.content && post.post.content.trim() ? (
                                <RenderText text={post.post.content} />
                            ) : post?.post?.caption ? (
                                <RenderText text={post.post.caption} />
                            ) : (
                                <span style={{ color: '#aaa' }}>No content</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {repostError && (
                <div className="repost-modal__error">{repostError}</div>
            )}
            <div className="repost-modal__actions">
                {repostSuccessId ? (
                    <>
                        <button
                            className="repost-modal__btn repost-modal__btn--success"
                            onClick={onGoToRepost}
                        >
                            Go to repost
                        </button>
                        <button
                            className="repost-modal__btn repost-modal__btn--cancel"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="repost-modal__btn repost-modal__btn--confirm"
                            onClick={onConfirm}
                            disabled={repostLoading}
                        >
                            {repostLoading ? "Reposting..." : "Confirm repost"}
                        </button>
                        <button
                            className="repost-modal__btn repost-modal__btn--cancel"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
);

export default RepostModal;
