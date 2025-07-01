// src/apps/community/tabs/general/CreatePost.jsx
import React, { useEffect, useRef, useState } from 'react';
import './createPost.css';
import { FaEllipsisV } from 'react-icons/fa';
import { useCreatePostContext } from '../../../context/CreatePostContext';
import { faAlignRight, faCalendarDay, faImage, faPoll } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CustomEditor from '../../../utils/editor/editor';
import Thread from './thread/thread';
import Visual from './visual/visual';
import Poll from './poll/poll';
import MediaPreview from './visual/mediaPreview';
import { formatDateTime } from '../../../utils/formatDateTime';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
// React Query
import { useMutation } from '@tanstack/react-query';
import { createPost } from '../../../services/home';
import { CREATE_POST } from '../../../services/queryKeys';
// Modal
import Modal from '../../../components/modal/Modal';

const CreatePost = () => {
    const navigate = useNavigate();
    const { authState } = useAuth();
    const imageUploadRef = useRef(null);
    const { closeCreatePostOverlay: onClose } = useCreatePostContext();

    const [showMediaPreview, setShowMediaPreview] = useState(false);
    const [selectedMediaFiles, setSelectedMediaFiles] = useState([]);
    const [activeButton, setActiveButton] = useState("Thread");
    const [visibilityActiveBtn, setVisibilityActiveBtn] = useState("Private");
    const [restrictionActiveBtn, setRestrictionActiveBtn] = useState("");
    const [isRestrictionValid, setIsRestrictionValid] = useState(true);
    const [commentsActiveBtn, setCommentsActiveBtn] = useState("Allow");
    const [expirationActiveBtn, setExpirationActiveBtn] = useState("Never");
    const [customExpirationDate, setCustomExpirationDate] = useState(() => {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay;
    });
    const [pollExpirationActiveBtn, setPollExpirationActiveBtn] = useState("1");
    const [customPollExpirationDate, setCustomPollExpirationDate] = useState(() => {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay;
    });
    const [showpostEditorToolbar, setShowpostEditorToolbar] = useState(false);
    const [editorContent, setEditorContent] = useState({
        Thread: '',
        Visual: '',
        Event: '',
    });
    const [eventData, setEventData] = useState({ title: '', date: '' });

    const threadRef = useRef();
    const visualRef = useRef();
    const pollRef = useRef();

    const mutation = useMutation({
        mutationKey: CREATE_POST,
        mutationFn: createPost,
        onSuccess: (data) => {
            onClose();
            navigate(`/posts/p/${data.id}`);
        },
        onError: (error) => {
            alert('Error creating post: ' + (error?.response?.data?.detail || error.message));
        },
    });

    useEffect(() => {
        window.history.pushState(null, '', '/create/post');
    }, []);

    const handleImageUpload = (fn) => {
        imageUploadRef.current = fn;
    };
    const handleButtonClick = () => {
        imageUploadRef.current?.();
    };

    const handleActiveButtonChange = (button) => {
        setActiveButton(button);
        setShowpostEditorToolbar(false);
    };

    const handleEditorChange = (content, tab) => {
        setEditorContent((prev) => ({ ...prev, [tab]: content }));
    };

    const handleMediaSelect = (files) => {
        setSelectedMediaFiles(files);
        setShowMediaPreview(true);
    };
    const handleTemporarySaveMedia = (savedMedia) => {
        setSelectedMediaFiles(savedMedia);
        setShowMediaPreview(false);
    };

    const getPollExpirationDate = () => {
        const now = new Date();
        if (pollExpirationActiveBtn === 'Custom') return customPollExpirationDate;
        const days = { '1': 1, '2': 2, '7': 7 }[pollExpirationActiveBtn] || 0;
        now.setDate(now.getDate() + days);
        return now;
    };
    const handlePollExpirationChange = (v) => {
        setPollExpirationActiveBtn(v);
        if (v !== "Custom") {
            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + Number(v));
            setCustomPollExpirationDate(nextDay);
        }
    };
    const handleCustomPollExpirationChange = (e) => {
        setCustomPollExpirationDate(e.target.value);
        setPollExpirationActiveBtn("Custom");
    };

    const getActiveTabData = () => {
        switch (activeButton) {
            case 'Thread': return threadRef.current.getData();
            case 'Visual': return visualRef.current.getData();
            case 'Poll': return pollRef.current.getData();
            case 'Event': return { type: 'Event', content: editorContent['Event'] };
            default: return {};
        }
    };

    const handleSubmit = () => {
        if (!restrictionActiveBtn) {
            setIsRestrictionValid(false);
            return;
        }
        if (activeButton === 'Visual' && !selectedMediaFiles.length) {
            alert("Please upload at least one image or video before posting a Visual post.");
            return;
        }
        const formData = new FormData();
        const tabData = getActiveTabData();
        formData.append('post_type', (activeButton === 'Poll' || activeButton === 'Event') ? 'Thread' : activeButton);
        formData.append('author', authState?.current?.user.username);
        formData.append('visibility', visibilityActiveBtn);
        formData.append('restriction', restrictionActiveBtn);
        formData.append('comments_setting', commentsActiveBtn);
        formData.append('content', editorContent[activeButton]);

        if (activeButton === 'Thread') {
            formData.append('content_type', tabData.content_type);
        }
        if (activeButton === 'Visual') {
            selectedMediaFiles.forEach(f => formData.append('media_files', f));
        }
        if (activeButton === 'Poll') {
            formData.append('question', tabData.question);
            tabData.options.forEach(o => formData.append('options', o));
            formData.append('expiration_date', getPollExpirationDate().toISOString());
        }
        if (activeButton === 'Event') {
            formData.append('title', tabData.title);
            formData.append('event_date', tabData.event_date);
        }

        mutation.mutate(formData);
    };

    // build subheader (your tab buttons)
    const subHeader = (
        <div className="create-post-type-select-group">
            <button
                className={`create-post-type-select-btn ${activeButton === 'Thread' ? 'active' : ''}`}
                onClick={() => handleActiveButtonChange("Thread")}
            >
                <FontAwesomeIcon icon={faAlignRight} className="icon-style" />
                Thread
            </button>
            <button
                className={`create-post-type-select-btn ${activeButton === 'Visual' ? 'active' : ''}`}
                onClick={() => handleActiveButtonChange("Visual")}
            >
                <FontAwesomeIcon icon={faImage} className="icon-style" />
                Visual
            </button>
            <button
                className={`create-post-type-select-btn ${activeButton === 'Poll' ? 'active' : ''}`}
                onClick={() => handleActiveButtonChange("Poll")}
            >
                <FontAwesomeIcon icon={faPoll} className="icon-style" />
                Poll/Quiz
            </button>
            <button
                className={`create-post-type-select-btn ${activeButton === 'Event' ? 'active' : ''}`}
                onClick={() => handleActiveButtonChange("Event")}
            >
                <FontAwesomeIcon icon={faCalendarDay} className="icon-style" />
                Event
            </button>
        </div>
    );

    // build footer buttons
    const footer = (
        <>
            <button className="cancel-post-btn" onClick={onClose}>Cancel</button>
            <div className="submit-post-group-btns">
                <button className="save-draft-btn">Save Draft</button>
                <button
                    className="submit-post-btn"
                    onClick={handleSubmit}
                    disabled={mutation.isLoading}
                >
                    {mutation.isLoading ? 'Posting…' : 'Post'}
                </button>
            </div>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Create Post"
            subHeader={!showMediaPreview ? subHeader : undefined}
            footer={!showMediaPreview ? footer : undefined}
            size="lg"
            maxHeight="800px"
        >
            {showMediaPreview ? (
                <MediaPreview
                    mediaFiles={selectedMediaFiles}
                    onBack={handleTemporarySaveMedia}
                />
            ) : (
                <div className="create-post-card-content">
                    <div className="create-post-card-content-inner">
                        <section className="create-post-form">
                            <div className="form-prompt-content">
                                {(activeButton !== 'Poll' && activeButton !== 'Event') && (
                                    <div className={`create-post-content-editor ${activeButton}`}>
                                        <CustomEditor
                                            placeholder="Write something here..."
                                            content={editorContent[activeButton]}
                                            onContentChange={c => handleEditorChange(c, activeButton)}
                                            showToolbar={showpostEditorToolbar}
                                            isOverlay={true}
                                            supportMedia={true}
                                            onImageUpload={handleImageUpload}
                                        />
                                    </div>
                                )}
                                {activeButton === 'Thread' && (
                                    <Thread
                                        ref={threadRef}
                                        showpostEditorToolbar={showpostEditorToolbar}
                                        setShowpostEditorToolbar={setShowpostEditorToolbar}
                                        handleButtonClick={handleButtonClick}
                                    />
                                )}
                                {activeButton === 'Visual' && (
                                    <Visual
                                        ref={visualRef}
                                        onMediaSelect={handleMediaSelect}
                                        mediaFiles={selectedMediaFiles}
                                    />
                                )}
                                {activeButton === 'Poll' && (
                                    <Poll ref={pollRef} />
                                )}
                                {activeButton === 'Event' && (
                                    <div className="create-post-content-editor Event">
                                        <CustomEditor
                                            placeholder="Write something here..."
                                            content={editorContent['Event']}
                                            onContentChange={c => handleEditorChange(c, 'Event')}
                                            showToolbar={showpostEditorToolbar}
                                            isOverlay={true}
                                        />
                                        <div className="create-post-actions-menubar-inner">
                                            <button
                                                className="create-post-settings-btn"
                                                onClick={() => setShowpostEditorToolbar(s => !s)}
                                            >
                                                {showpostEditorToolbar ? 'Hide Toolbar' : 'Show Toolbar'}
                                            </button>
                                            <button className="create-post-settings-btn">
                                                <FaEllipsisV className="icon-style" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="post-settings">
                            {/* — Visibility */}
                            <div>
                                <div className='post-sub-setting-header'>
                                    <h3>Visibility</h3>
                                    <p>
                                        {visibilityActiveBtn === 'Private'
                                            ? 'Visible to your followers. To keep to yourself only, save as draft.'
                                            : visibilityActiveBtn === 'Public'
                                                ? 'Visible to everyone'
                                                : visibilityActiveBtn === 'Friends'
                                                    ? 'Visible to your friends only'
                                                    : visibilityActiveBtn === 'Select'
                                                        ? 'Visible to selected people only'
                                                        : 'Visible to all your followers except for selected people'
                                        }
                                    </p>
                                </div>
                                <div className='post-settings-options'>
                                    <button
                                        className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Private' ? 'active' : ''}`}
                                        onClick={() => setVisibilityActiveBtn("Private")}
                                    >Private</button>
                                    <button
                                        className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Public' ? 'active' : ''}`}
                                        onClick={() => setVisibilityActiveBtn("Public")}
                                    >Public</button>
                                    <button
                                        className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Friends' ? 'active' : ''}`}
                                        onClick={() => setVisibilityActiveBtn("Friends")}
                                    >Friends Only</button>
                                    <button
                                        className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Select' ? 'active' : ''}`}
                                        onClick={() => setVisibilityActiveBtn("Select")}
                                    >Select</button>
                                    <button
                                        className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Exclude' ? 'active' : ''}`}
                                        onClick={() => setVisibilityActiveBtn("Exclude")}
                                    >Select to Exclude</button>
                                </div>
                            </div>

                            {/* — Restrictions */}
                            <div>
                                <div className={`post-sub-setting-header ${!isRestrictionValid ? 'invalid' : ''}`}>
                                    <h3>Restrictions</h3>
                                    <p>
                                        {restrictionActiveBtn === 'SFW'
                                            ? 'Suitable for all audiences. Choose this for any general content.'
                                            : restrictionActiveBtn === 'NSFW'
                                                ? 'May contain explicit or mature content. Intended for 18+ viewers.'
                                                : 'Please choose the appropriate option before continuing.'
                                        }
                                    </p>
                                </div>
                                <div className='post-settings-options'>
                                    <button
                                        className={`post-settings-card-container-btn ${restrictionActiveBtn === 'SFW' ? 'active' : ''}`}
                                        onClick={() => { setRestrictionActiveBtn("SFW"); setIsRestrictionValid(true); }}
                                    >SFW</button>
                                    <button
                                        className={`post-settings-card-container-btn ${restrictionActiveBtn === 'NSFW' ? 'active' : ''}`}
                                        onClick={() => { setRestrictionActiveBtn("NSFW"); setIsRestrictionValid(true); }}
                                    >NSFW</button>
                                </div>
                            </div>

                            {/* — Poll Expiration */}
                            {activeButton === 'Poll' && (
                                <div>
                                    <div className='post-sub-setting-header'>
                                        <h3>Poll Expiration</h3>
                                        <p>
                                            {pollExpirationActiveBtn === '1' ? 'Poll will close after 1 day.' :
                                                pollExpirationActiveBtn === '2' ? 'Poll will close after 2 days.' :
                                                    pollExpirationActiveBtn === '7' ? 'Poll will close after 7 days.' :
                                                        pollExpirationActiveBtn === 'Custom'
                                                            ? `Expires on ${formatDateTime(customPollExpirationDate, true)}.`
                                                            : ''}
                                            Results will be available to the participants.
                                        </p>
                                    </div>
                                    <div className='post-settings-options'>
                                        <button className={`post-settings-card-container-btn ${pollExpirationActiveBtn === '1' ? 'active' : ''}`}
                                            onClick={() => handlePollExpirationChange("1")}>1 day</button>
                                        <button className={`post-settings-card-container-btn ${pollExpirationActiveBtn === '2' ? 'active' : ''}`}
                                            onClick={() => handlePollExpirationChange("2")}>2 days</button>
                                        <button className={`post-settings-card-container-btn ${pollExpirationActiveBtn === '7' ? 'active' : ''}`}
                                            onClick={() => handlePollExpirationChange("7")}>7 days</button>
                                        <button className={`post-settings-card-container-btn ${pollExpirationActiveBtn === 'Custom' ? 'active' : ''}`}
                                            onClick={() => handlePollExpirationChange("Custom")}>Custom Date</button>
                                        {pollExpirationActiveBtn === "Custom" && (
                                            <label className="create-post-input">
                                                Custom Date:
                                                <input type="datetime-local" onChange={handleCustomPollExpirationChange} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* — Post Expiration */}
                            {activeButton !== 'Poll' && (
                                <div>
                                    <div className='post-sub-setting-header'>
                                        <h3>Post Expiration</h3>
                                        <p>
                                            {expirationActiveBtn === 'Never' ? 'Post stays permanently unless deleted.' :
                                                expirationActiveBtn === '24 Hours' ? 'Post will be deleted after 24 hours.' :
                                                    expirationActiveBtn === 'Custom' ? `Expires on ${formatDateTime(customExpirationDate, true)}` : ''}
                                        </p>
                                    </div>
                                    <div className='post-settings-options'>
                                        <button className={`post-settings-card-container-btn ${expirationActiveBtn === 'Never' ? 'active' : ''}`}
                                            onClick={() => setExpirationActiveBtn("Never")}>Never Expire</button>
                                        <button className={`post-settings-card-container-btn ${expirationActiveBtn === '24 Hours' ? 'active' : ''}`}
                                            onClick={() => setExpirationActiveBtn("24 Hours")}>24 Hours</button>
                                        <button className={`post-settings-card-container-btn ${expirationActiveBtn === 'Custom' ? 'active' : ''}`}
                                            onClick={() => setExpirationActiveBtn("Custom")}>Custom Date</button>
                                        {expirationActiveBtn === "Custom" && (
                                            <label className="create-post-input">
                                                Custom Date:
                                                <input type="datetime-local" onChange={e => setCustomExpirationDate(e.target.value)} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* — Comments */}
                            <div>
                                <div className='post-sub-setting-header'>
                                    <h3>Comments</h3>
                                    <p>
                                        {commentsActiveBtn === 'Allow' ? 'Anyone, to whom your post is visible to, can comment.' :
                                            commentsActiveBtn === 'Disable' ? 'Comments are disabled. No one can comment.' :
                                                commentsActiveBtn === 'Friends' ? 'Only your friends can comment on this post.' :
                                                    commentsActiveBtn === 'Approval' ? 'Comments will only appear after you approve them.' : ''}
                                    </p>
                                </div>
                                <div className='post-settings-options'>
                                    <button className={`post-settings-card-container-btn ${commentsActiveBtn === 'Allow' ? 'active' : ''}`}
                                        onClick={() => setCommentsActiveBtn("Allow")}>Allow</button>
                                    <button className={`post-settings-card-container-btn ${commentsActiveBtn === 'Disable' ? 'active' : ''}`}
                                        onClick={() => setCommentsActiveBtn("Disable")}>Disable</button>
                                    <button className={`post-settings-card-container-btn ${commentsActiveBtn === 'Friends' ? 'active' : ''}`}
                                        onClick={() => setCommentsActiveBtn("Friends")}>Friends Only</button>
                                    <button className={`post-settings-card-container-btn ${commentsActiveBtn === 'Approval' ? 'active' : ''}`}
                                        onClick={() => setCommentsActiveBtn("Approval")}>Require Approval</button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {mutation.isError && (
                <div className="post-error-message">
                    {mutation.error?.response?.data?.detail
                        || mutation.error?.message
                        || 'Failed to create post.'}
                </div>
            )}
        </Modal>
    );
};

export default CreatePost;
