import React, { useEffect, useRef, useState } from 'react';
import './createPost.css';
import { FaTimes } from 'react-icons/fa';
import { useCreatePostContext } from '../../context/CreatePostContext';
import { faAlignRight, faCalendarDay, faCameraRetro, faImage, faMicrophoneLines, faPoll } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CustomEditor from '../../utils/editor/editor';
import Thread from './thread/thread';
import Visual from './visual/visual';
import Poll from './poll/poll';
import MediaPreview from './visual/mediaPreview';

const CreatePost = () => {
    const imageUploadRef = useRef(null);
    
    const { closeCreatePostOverlay: onClose } = useCreatePostContext();

    const [showMediaPreview, setShowMediaPreview] = useState(false);
    const [selectedMediaFiles, setSelectedMediaFiles] = useState([]);

    const [activeButton, setActiveButton] = useState("Thread");

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
        Poll: '',
        Story: '',
        Event: '',
        Audio: '',
    });

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
                                <button className={`create-post-type-select-btn  ${activeButton === 'Story' ? 'active' : ''}`} onClick={() => handleActiveButtonChange("Story")}>
                                    <FontAwesomeIcon icon={faCameraRetro} className="icon-style" />
                                    Story
                                </button>
                                <button className={`create-post-type-select-btn  ${activeButton === 'Event' ? 'active' : ''}`} onClick={() => handleActiveButtonChange("Event")}>
                                    <FontAwesomeIcon icon={faCalendarDay} className="icon-style" />
                                    Event
                                </button>
                                <button className={`create-post-type-select-btn  ${activeButton === 'Audio' ? 'active' : ''}`} onClick={() => handleActiveButtonChange("Audio")}>
                                    <FontAwesomeIcon icon={faMicrophoneLines} className="icon-style" />
                                    Audio
                                </button>
                            </div>
                            <div className='form-prompt-content'>
                                {activeButton !== 'Poll' &&
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
                                        showpostEditorToolbar={showpostEditorToolbar}
                                        setShowpostEditorToolbar={setShowpostEditorToolbar}
                                        handleButtonClick={handleButtonClick}
                                    />
                                }
                                {activeButton === 'Visual' && <Visual onMediaSelect={handleMediaSelect} mediaFileCount={selectedMediaFiles.length} />}
                                {activeButton === 'Poll' && <Poll />}
                                {activeButton === 'Story' &&
                                    <div className="story-post-fields">
                                        {/* <input type="file" accept="image/*,video/*" className="create-post-input" /> */}
                                    </div>
                                }

                                {activeButton === 'Event' &&
                                    <div className="event-post-fields">
                                        {/* <input type="text" placeholder="Event Title" className="create-post-input" />
                                <input type="datetime-local" className="create-post-input" />
                                <input type="text" placeholder="Event Location" className="create-post-input" /> */}
                                    </div>
                                }

                                {activeButton === 'Audio' &&
                                    <div className="audio-post-fields">
                                        {/* <input type="file" accept="audio/*" className="create-post-input" /> */}
                                    </div>
                                }
                            </div>
                        </section>
                        <div className='submit-post-btns'>
                            <button className='submit-post-btn'>Post</button>
                            <button className='save-draft-btn'>Save Draft</button>
                            <button className='cancel-post-btn'>Cancel</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
};

export default CreatePost;