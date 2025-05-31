import React, { useEffect, useRef, useState } from 'react';
import './createPost.scss';
import { FaEllipsisV, FaTimes } from 'react-icons/fa';
import { useCreatePostContext } from '../../../context/CreatePostContext';
import { faAlignRight, faCalendarDay, faCameraRetro, faImage, faMicrophoneLines, faPoll } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CustomEditor from '../../../utils/editor/editor';
import Thread from './thread/thread';
import Visual from './visual/visual';
import Poll from './poll/poll';
import MediaPreview from './visual/mediaPreview';
import { formatDateTime } from '../../../utils/formatDateTime';
import useApi from '../../../utils/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';


const CreatePost = () => {
    const navigate = useNavigate();
    const { authState } = useAuth();
    const { callApi } = useApi();
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
        nextDay.setDate(nextDay.getDate() + 1);  // Add 1 day to the current date
        return nextDay;
    });

    const [pollExpirationActiveBtn, setPollExpirationActiveBtn] = useState("1"); // Default to 1 day
    const [customPollExpirationDate, setCustomPollExpirationDate] = useState(() => {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);  // Add 1 day to the current date
        return nextDay;
    });

    const handleImageUpload = (handleImageUploadFn) => {
        imageUploadRef.current = handleImageUploadFn;
    };
    const handleButtonClick = () => {
        if (imageUploadRef.current) {
            imageUploadRef.current();  // Trigger the image upload function
        }
    };

    const handleActiveButtonChange = (button) => {
        setActiveButton(button);
        setShowpostEditorToolbar(false);
    }

    const [showpostEditorToolbar, setShowpostEditorToolbar] = useState(false);

    const [editorContent, setEditorContent] = useState({
        Thread: '',
        Visual: '',
        Event: '',
    });

    const [eventData, setEventData] = useState({ title: '', date: '' });


    const handleEditorChange = (content, tab) => {
        setEditorContent((prevContent) => ({
            ...prevContent,
            [tab]: content,
        }));
    };

    useEffect(() => {
        window.history.pushState(null, '', '/create/post');
    }, []);

    const handleMediaSelect = (files) => {
        console.log(files)
        setSelectedMediaFiles(files);
        setShowMediaPreview(true);
    };

    const handleTemporarySaveMedia = (savedMedia) => {
        setSelectedMediaFiles(savedMedia); // Store the temporarily saved media
        setShowMediaPreview(false); // Hide the media preview and go back to the main form
    };



    const getPollExpirationDate = () => {
        const now = new Date();
        if (pollExpirationActiveBtn === '1') {
            return new Date(now.setDate(now.getDate() + 1)); // Expire in 1 day
        } else if (pollExpirationActiveBtn === '2') {
            return new Date(now.setDate(now.getDate() + 2)); // Expire in 2 days
        } else if (pollExpirationActiveBtn === '7') {
            return new Date(now.setDate(now.getDate() + 7)); // Expire in 7 days
        } else if (pollExpirationActiveBtn === 'Custom' && customPollExpirationDate) {
            return customPollExpirationDate; // Custom date expiration
        } else {
            return null; // Default to no expiration
        }
    };

    const handlePollExpirationChange = (value) => {
        setPollExpirationActiveBtn(value);
        if (value !== "Custom") {
            setCustomPollExpirationDate(() => {
                const nextDay = new Date();
                nextDay.setDate(nextDay.getDate() + 1);  // Add 1 day to the current date
                return nextDay;
            }); // Reset custom date when selecting predefined options
        };
    };

    const handleCustomPollExpirationChange = (e) => {
        setCustomPollExpirationDate(e.target.value);
        setPollExpirationActiveBtn("Custom"); // Set active flag to Custom when selecting a date
    };


    const threadRef = React.useRef();
    const visualRef = React.useRef();
    const pollRef = React.useRef();

    // Function to collect data from the active tab
    const getActiveTabData = () => {
        switch (activeButton) {
            case 'Thread':
                return threadRef.current.getData();
            case 'Visual':
                return visualRef.current.getData();
            case 'Poll':
                return pollRef.current.getData();
            case 'Event':
                return { type: 'Event', content: editorContent['Event'] };
            default:
                return {};
        }
    };

    // Function to handle form submission
    const handleSubmit = async () => {
        if (!restrictionActiveBtn) {
            setIsRestrictionValid(false);
            return;
        } else {
            setIsRestrictionValid(true);
        }

        if (activeButton === 'Visual' && selectedMediaFiles.length === 0) {
            alert("Please upload at least one image or video before posting a Visual post.");
            return;
        }

        const activeTabData = getActiveTabData();
        console.log('Active Tab Data:', activeTabData);
        console.log(' editorContent[activeButton]:', editorContent[activeButton]);
        // Build form data
        const formData = new FormData();

        formData.append('post_type', activeButton === 'Poll' || activeButton === 'Event' ? 'Thread' : activeButton);
        formData.append('author', authState?.current?.user.username);
        formData.append('visibility', visibilityActiveBtn);
        formData.append('restriction', restrictionActiveBtn);
        formData.append('comments_setting', commentsActiveBtn);
        formData.append('content', editorContent[activeButton]);

        if (activeButton === 'Thread') {
            formData.append('content_type', activeTabData.content_type);
        }
        if (activeButton === 'Visual') {
            selectedMediaFiles.forEach(file => {
                formData.append('media_files', file); // ✅ append real files!
            });
        }
        if (activeButton === 'Poll') {
            formData.append('question', activeTabData.question);
            activeTabData.options.forEach(option => {
                formData.append('options', option);
            });
            formData.append('expiration_date', getPollExpirationDate().toISOString());
        }

        if (activeButton === 'Event') {
            formData.append('title', activeTabData.title);
            formData.append('event_date', activeTabData.event_date);
        }

        console.log('Submitting FormData:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ':', pair[1]);
        }


        try {
            const response = await callApi('posts/post/', 'POST', formData, "multipart/form-data");
            console.log('Post created successfully:', response.data);
            onClose(); // Close the overlay after successful post creation
            navigate(`/posts/p/${response.data.id}`);
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };


    console.log(activeButton);;

    return (
        <div className="create-post-overlay" onClick={() => onClose()}>
            <div className='create-post-card' onClick={(e) => e.stopPropagation(e)}>
                {showMediaPreview ? (
                    <MediaPreview
                        mediaFiles={selectedMediaFiles}
                        onBack={handleTemporarySaveMedia}
                    />
                ) : (
                    <>
                        <h2>Create Post</h2>
                        <button className="create-post-overlay-close-btn" onClick={() => onClose()}>
                            <FaTimes className="icon-style" />
                        </button>
                        <div className='create-post-card-content'>
                            <div className='create-post-card-content-inner'>
                                <section className="create-post-form">
                                    <div className='create-post-type-select-group'>
                                        <button className={`create-post-type-select-btn  ${activeButton === 'Thread' ? 'active' : ''}`} onClick={() => handleActiveButtonChange("Thread")}>
                                            <FontAwesomeIcon icon={faAlignRight} className="icon-style" />
                                            Thread
                                        </button>
                                        <button className={`create-post-type-select-btn  ${activeButton === 'Visual' ? 'active' : ''}`} onClick={() => handleActiveButtonChange("Visual")}>
                                            <FontAwesomeIcon icon={faImage} className="icon-style" />
                                            Visual
                                        </button>
                                        <button className={`create-post-type-select-btn  ${activeButton === 'Poll' ? 'active' : ''}`} onClick={() => handleActiveButtonChange("Poll")}>
                                            <FontAwesomeIcon icon={faPoll} className="icon-style" />
                                            Poll/Quiz
                                        </button>
                                        <button className={`create-post-type-select-btn  ${activeButton === 'Event' ? 'active' : ''}`} onClick={() => handleActiveButtonChange("Event")}>
                                            <FontAwesomeIcon icon={faCalendarDay} className="icon-style" />
                                            Event
                                        </button>
                                    </div>
                                    <div className='form-prompt-content'>
                                        {(activeButton !== 'Poll' && activeButton !== 'Event') &&
                                            <div className={`create-post-content-editor ${activeButton}`}>
                                                <CustomEditor
                                                    placeholder="Write something here..."
                                                    content={editorContent[activeButton]} // Use unique content per tab
                                                    onContentChange={(content) => handleEditorChange(content, activeButton)} // Update the content for the active tab
                                                    showToolbar={showpostEditorToolbar}
                                                    isOverlay={true}
                                                    supportMedia={true}
                                                    onImageUpload={handleImageUpload}
                                                />
                                            </div>
                                        }
                                        {activeButton === 'Thread' &&
                                            <Thread
                                                ref={threadRef}
                                                showpostEditorToolbar={showpostEditorToolbar}
                                                setShowpostEditorToolbar={setShowpostEditorToolbar}
                                                handleButtonClick={handleButtonClick}
                                            />
                                        }
                                        {activeButton === 'Visual' &&
                                            <Visual
                                                ref={visualRef}
                                                onMediaSelect={handleMediaSelect}
                                                mediaFiles={selectedMediaFiles}
                                            />
                                        }
                                        {activeButton === 'Poll' &&
                                            <Poll
                                                ref={pollRef}
                                            />
                                        }
                                        {(activeButton === 'Event' && activeButton !== 'Poll') &&
                                            <div className='create-post-content-editor Event'>
                                                <CustomEditor
                                                    placeholder="Write something here..."
                                                    content={editorContent['Event']}
                                                    onContentChange={(content) => handleEditorChange(content, 'Event')}
                                                    showToolbar={showpostEditorToolbar}
                                                    isOverlay={true}
                                                />
                                                <div className="create-post-actions-menubar-inner">
                                                    <button
                                                        className="create-post-settings-btn"
                                                        onClick={() => setShowpostEditorToolbar(!showpostEditorToolbar)}
                                                    >
                                                        {showpostEditorToolbar ? 'Hide Toolbar' : 'Show Toolbar'}
                                                    </button>
                                                    <button className="create-post-settings-btn">
                                                        <FaEllipsisV className="icon-style" />
                                                    </button>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </section>
                                <section className='post-settings'>
                                    <div>
                                        <div className='post-sub-setting-header'>
                                            <h3>Visibility</h3>
                                            <p>{visibilityActiveBtn === 'Private' ? 'Visible to your followers. To keep to yourself only, save as draft.' :
                                                visibilityActiveBtn === 'Public' ? 'Visible to everyone' :
                                                    visibilityActiveBtn === 'Friends' ? 'Visible to your friends only' :
                                                        visibilityActiveBtn === 'Select' ? 'Visible to selected people only' :
                                                            visibilityActiveBtn === 'Exclude' ? 'Visible to all your followers except for selected people' : ''
                                            }</p>
                                        </div>
                                        <div className='post-settings-options'>
                                            <button
                                                className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Private' ? 'active' : ''}`}
                                                onClick={() => setVisibilityActiveBtn("Private")}
                                            >
                                                Private
                                            </button>
                                            <button
                                                className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Public' ? 'active' : ''}`}
                                                onClick={() => setVisibilityActiveBtn("Public")}
                                            >
                                                Public
                                            </button>
                                            <button
                                                className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Friends' ? 'active' : ''}`}
                                                onClick={() => setVisibilityActiveBtn("Friends")}
                                            >
                                                Friends Only
                                            </button>
                                            <button
                                                className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Select' ? 'active' : ''}`}
                                                onClick={() => setVisibilityActiveBtn("Select")}
                                            >
                                                Select
                                            </button>
                                            <button
                                                className={`post-settings-card-container-btn ${visibilityActiveBtn === 'Exclude' ? 'active' : ''}`}
                                                onClick={() => setVisibilityActiveBtn("Exclude")}
                                            >
                                                Select to Exclude
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className={`post-sub-setting-header ${!isRestrictionValid ? 'invalid' : ''}`}>
                                            <h3>Restrictions</h3>
                                            <p>
                                                {restrictionActiveBtn === 'SFW' ? 'Suitable for all audiences. Choose this for any general content.' :
                                                    restrictionActiveBtn === 'NSFW' ? 'May contain explicit or mature content. Intended for 18+ viewers.' :
                                                        'Please choose the appropriate option before continuing.'
                                                }
                                            </p>
                                        </div>
                                        <div className={`post-settings-options`}>
                                            <button
                                                className={`post-settings-card-container-btn ${restrictionActiveBtn === 'SFW' ? 'active' : ''}`}
                                                onClick={() => {
                                                    setRestrictionActiveBtn("SFW");
                                                    setIsRestrictionValid(true);
                                                }}
                                            >
                                                SFW
                                            </button>
                                            <button
                                                className={`post-settings-card-container-btn ${restrictionActiveBtn === 'NSFW' ? 'active' : ''}`}
                                                onClick={() => {
                                                    setRestrictionActiveBtn("NSFW");
                                                    setIsRestrictionValid(true);
                                                }}
                                            >
                                                NSFW
                                            </button>
                                        </div>
                                    </div>
                                    {activeButton === 'Poll' &&
                                        <div>
                                            <div className='post-sub-setting-header'>
                                                <h3>Poll Expiration</h3>
                                                <p>
                                                    {pollExpirationActiveBtn === '1' ? 'Poll will close after 1 day. ' :
                                                        pollExpirationActiveBtn === '2' ? 'Poll will close after 2 days. ' :
                                                            pollExpirationActiveBtn === '7' ? 'Poll will close after 7 days. ' :
                                                                pollExpirationActiveBtn === 'Custom' ? `Expires on ${formatDateTime(customPollExpirationDate, true)}. ` : ''}
                                                    Results will be available to the participants.
                                                </p>
                                            </div>
                                            <div className='post-settings-options'>
                                                <button className={`post-settings-card-container-btn ${pollExpirationActiveBtn === '1' ? 'active' : ''}`}
                                                    onClick={() => handlePollExpirationChange("1")}>
                                                    1 day
                                                </button>
                                                <button className={`post-settings-card-container-btn ${pollExpirationActiveBtn === '2' ? 'active' : ''}`}
                                                    onClick={() => handlePollExpirationChange("2")}>
                                                    2 days
                                                </button>
                                                <button className={`post-settings-card-container-btn ${pollExpirationActiveBtn === '7' ? 'active' : ''}`}
                                                    onClick={() => handlePollExpirationChange("7")}>
                                                    7 days
                                                </button>
                                                <button className={`post-settings-card-container-btn ${pollExpirationActiveBtn === 'Custom' ? 'active' : ''}`}
                                                    onClick={() => handlePollExpirationChange("Custom")}>
                                                    Custom Date
                                                </button>
                                                {pollExpirationActiveBtn === "Custom" && (
                                                    <label className="create-post-input">
                                                        Custom Date:
                                                        <input type="datetime-local" onChange={handleCustomPollExpirationChange} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>}
                                    {activeButton !== 'Poll' &&
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
                                                    onClick={() => setExpirationActiveBtn("Never")}>
                                                    Never Expire
                                                </button>
                                                <button className={`post-settings-card-container-btn ${expirationActiveBtn === '24 Hours' ? 'active' : ''}`}
                                                    onClick={() => setExpirationActiveBtn("24 Hours")}>
                                                    24 Hours
                                                </button>
                                                <button className={`post-settings-card-container-btn ${expirationActiveBtn === 'Custom' ? 'active' : ''}`}
                                                    onClick={() => setExpirationActiveBtn("Custom")}>
                                                    Custom Date
                                                </button>
                                                {expirationActiveBtn === "Custom" && (
                                                    <label className="create-post-input">
                                                        Custom Date:
                                                        <input type="datetime-local" onChange={(e) => setCustomExpirationDate(e.target.value)} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>}
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
                                            <button
                                                className={`post-settings-card-container-btn ${commentsActiveBtn === 'Allow' ? 'active' : ''}`}
                                                onClick={() => setCommentsActiveBtn("Allow")}
                                            >
                                                Allow
                                            </button>
                                            <button
                                                className={`post-settings-card-container-btn ${commentsActiveBtn === 'Disable' ? 'active' : ''}`}
                                                onClick={() => setCommentsActiveBtn("Disable")}
                                            >
                                                Disable
                                            </button>
                                            <button
                                                className={`post-settings-card-container-btn ${commentsActiveBtn === 'Friends' ? 'active' : ''}`}
                                                onClick={() => setCommentsActiveBtn("Friends")}
                                            >
                                                Friends Only
                                            </button>
                                            <button
                                                className={`post-settings-card-container-btn ${commentsActiveBtn === 'Approval' ? 'active' : ''}`}
                                                onClick={() => setCommentsActiveBtn("Approval")}
                                            >
                                                Require Approval
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                        <div className='submit-post-btns'>
                            <button className='submit-post-btn' onClick={handleSubmit}>Post</button>
                            <button className='save-draft-btn'>Save Draft</button>
                            <button className='cancel-post-btn' onClick={onClose}>Cancel</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
};

export default CreatePost;