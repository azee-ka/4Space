import React, { useEffect, useState } from "react";
import './createPost-1.css';
import useApi from "../../utils/useApi";
import { useNavigate } from "react-router-dom";
import DOMPurify from 'dompurify';
import { FaEllipsisV, FaLine, FaTimes, FaUpload } from "react-icons/fa";
import { useCreatePostContext } from "../../context/CreatePostContext";
import API_BASE_URL from "../../utils/apiUrl";
import VideoPlayer from "../../components/videoPlayer/videoPlayer";
import CustomEditor from "../../utils/editor/editor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAlignCenter, faAlignLeft, faAlignRight, faBookOpen, faBorderAll, faCalendarCheck, faCalendarDay, faCameraRetro, faCircle, faFileAlt, faImage, faLinesLeaning, faParagraph, faPlayCircle, faPoll, faTableList, faTextHeight } from "@fortawesome/free-solid-svg-icons";

const CreatePost = () => {
    const { callApi } = useApi();
    const navigate = useNavigate();
    const { closeCreatePostOverlay: onClose } = useCreatePostContext();

    const [showpostEditorToolbar, setShowpostEditorToolbar] = useState(false);

    // State for various fields
    const [content, setContent] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const [previewMedia, setPreviewMedia] = useState(null);

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);


    const [isSensitive, setIsSensitive] = useState(false);
    const [postType, setpostType] = useState("idea");
    const [isPrivate, setIsPrivate] = useState(true);

    const [activeButton, setActiveButton] = useState("Thread");

    // Handlers
    const handlepostTypeChange = (e) => setpostType(e.target.value);
    const handlePublicChange = (e) => setIsPrivate(e.target.checked);
    // const handleUploadedFilesChange = (e) => setUploadedFiles([...e.target.files]);
    const handleSensitiveChange = (e) => setIsSensitive(e.target.checked);

    useEffect(() => {
        window.history.pushState(null, '', '/create/post');
    }, []);




    const handleNextMedia = () => {
        setCurrentMediaIndex((prev) => prev + 1);
        setPreviewMedia(URL.createObjectURL(uploadedFiles[currentMediaIndex + 1]));
    }
    const handlePreviousMedia = () => {
        setCurrentMediaIndex((prev) => prev - 1);
        setPreviewMedia(URL.createObjectURL(uploadedFiles[currentMediaIndex - 1]));
    }
    const handleSelectedMedia = (event) => {
        const selectedFiles = Array.from(event.target.files).filter(
            (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
        );
        setUploadedFiles((prev) => [...prev, ...selectedFiles]);
        setPreviewMedia(URL.createObjectURL(selectedFiles[0]));
        setCurrentMediaIndex(0);
    }
    const handleMediaUpload = () => {
        console.log(uploadedFiles);
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*, video/*';
        fileInput.multiple = true;
        fileInput.click();
        fileInput.addEventListener('change', (e) => handleSelectedMedia(e));
    }

    const handleSubmit = async () => {
        const formData = new FormData();

        formData.append('content', content);
        formData.append('is_sensitive', isSensitive);
        formData.append('is_private', isPrivate);
        formData.append('post_type', postType);

        // Append files to the FormData object
        uploadedFiles.forEach(file => {
            formData.append('uploaded_files', file);
        });

        try {
            const response = await callApi(`quantaspace/post/create-post/`, 'POST', formData, 'multipart/form-data');
            console.log(response.data);
            const postId = response.data.uuid;

            // Navigate to the newly created post page
            onClose();
            navigate(`/post/${postId}`);
        } catch (err) {
            console.error('Error posting post', err);
        }
    };


    const renderMediaContent = (uploadedMediaThis, onEnded) => {
        const medias = {
            file: previewMedia,
            media_type: uploadedMediaThis[currentMediaIndex].type,
            id: currentMediaIndex,
        }
        if (uploadedMediaThis[currentMediaIndex].type.includes('video')) {
            return (
                <VideoPlayer
                    mediaFile={medias}
                    onEnded={onEnded}
                    playable={true}
                    url={API_BASE_URL}
                />
            );
        } else {
            return (
                <img src={previewMedia} alt={uploadedMediaThis.id} />
            );
        }
    };


    const renderActiveSection = () => {
        switch (activeButton) {
            case "Thread":
                return <section className="create-post-content-editor">
                            <CustomEditor
                                placeholder='Write something here...'
                                content={content}
                                onContentChange={setContent}
                                showToolbar={showpostEditorToolbar}
                                isOverlay={true}
                            />
                            {uploadedFiles.length > 0 &&
                                <div className="create-post-uploaded-files-preview">
                                    <div className="create-post-files-preview-per-page">
                                        {renderMediaContent(uploadedFiles, null)}
                                    </div>
                                </div>
                            }
                            <div className="create-post-actions-menubar">
                                <div className="create-post-actions-menubar-inner">
                                    <div className="create-post-menu-btn" onClick={handleMediaUpload}>
                                        <label>
                                            <FaUpload className="icon-style" />
                                        </label>
                                    </div>
                                    <div className="create-post-menu-btn" id="create-post-menu-btn-selector">
                                        <select value={postType} onChange={handlepostTypeChange}>
                                            <option disabled value="idea">Select Type</option>
                                            <option value="announcement">Announcement</option>
                                            <option value="idea">Idea</option>
                                            <option value="question">Question</option>
                                            <option value="poll">Poll</option>
                                        </select>
                                    </div>
                                </div>
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
                        </section>;
            case "Visual":
                return (
                       <section className="create-post-content-editor">
                            <CustomEditor
                                placeholder='Write something here...'
                                content={content}
                                onContentChange={setContent}
                                showToolbar={showpostEditorToolbar}
                                isOverlay={true}
                            />
                            <div className="create-post-menu-visual-btn" onClick={handleMediaUpload}>
                                        <label>
                                            <FaUpload className="icon-style" />
                                        </label>
                            </div>
                            {uploadedFiles.length > 0 &&
                                <div className="create-post-uploaded-files-preview">
                                    <div className="create-post-files-preview-per-page">
                                        {renderMediaContent(uploadedFiles, null)}
                                    </div>
                                </div>
                            }
                    </section>
                );
            case "Poll/Quiz":
                return (
                    <div className="poll-editor">
                        <input type="text" placeholder="Enter your question..." />
                        <input type="text" placeholder="Option 1" />
                        <input type="text" placeholder="Option 2" />
                        <button>Add Option</button>
                    </div>
                );
            case "Event":
                return (
                    <div className="event-editor">
                        <input type="text" placeholder="Event Title" />
                        <input type="date" />
                        <textarea placeholder="Event Description"></textarea>
                    </div>
                );
            default:
                return null;
        }
    };



    return (
        <div className="create-post-page" onClick={() => onClose()}>
            <div className="create-post-card" onClick={(e) => e.stopPropagation(e)}>
                <button className="create-post-overlay-close-btn" onClick={() => onClose()}>
                    <FaTimes className="icon-style" />
                </button>
                <h3>Create Post</h3>
                <section className="create-post-type-cards">
                    <button
                        className={`create-post-type-card ${activeButton === 'Thread' ? 'active' : ''}`}
                        onClick={() => setActiveButton('Thread')}
                    >
                        <FontAwesomeIcon icon={faAlignRight} className="icon-style" />
                        Thread
                    </button>
                    <button
                        className={`create-post-type-card ${activeButton === 'Visual' ? 'active' : ''}`}
                        onClick={() => setActiveButton('Visual')}
                    >
                        <FontAwesomeIcon icon={faImage} className="icon-style" />
                        Visual
                    </button>
                    <button
                        className={`create-post-type-card ${activeButton === 'Poll/Quiz' ? 'active' : ''}`}
                        onClick={() => setActiveButton('Poll/Quiz')}
                    >
                        <FontAwesomeIcon icon={faPoll} className="icon-style" />
                        Poll/Quiz
                    </button>
                    <button
                        className={`create-post-type-card ${activeButton === 'Story' ? 'active' : ''}`}
                        onClick={() => setActiveButton('Story')}
                    >
                        <FontAwesomeIcon icon={faCameraRetro} className="icon-style" />
                        Story
                    </button>
                    <button
                        className={`create-post-type-card ${activeButton === 'Event' ? 'active' : ''}`}
                        onClick={() => setActiveButton('Event')}
                    >
                        <FontAwesomeIcon icon={faCalendarDay} className="icon-style" />
                        Event
                    </button>
                </section>
                {renderActiveSection()}
                <div className="create-post-submit-btn">
                    <button onClick={handleSubmit}>Create Post</button>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
