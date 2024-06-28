import React, { useState, useRef } from 'react';
import axios from 'axios';
import './createPost.css';
import API_BASE_URL from '../../../../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../../../../../general/components/Authentication/utils/AuthProvider';
import GetConfig from '../../../../../general/components/Authentication/utils/config';
import VideoPlayer from '../../../utils/videoPlayer/videoPlayer';

const CreatePost = () => {
    const navigate = useNavigate();
    const { token } = useAuthState();
    const config = GetConfig(token)
    const [content, setContent] = useState('');
    const textAreaRef = useRef(null);
    const [uploadedMedia, setUploadedMedia] = useState([]);
    const [previewMedia, setPreviewMedia] = useState(null);

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    const handleSelectedMedia = (event) => {
        const selectedFiles = event.target.files;

        // Check if files were actually selected
        if (selectedFiles.length > 0) {
            // Check each selected file
            const validMediaFiles = Array.from(selectedFiles).filter(
                (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
            );

            if (validMediaFiles.length > 0) {
                // Use the callback form of setUploadedMedia to ensure you're working with the latest state
                setUploadedMedia((prevMedia) => [...prevMedia, ...validMediaFiles]);

                // Set the index to the first media file
                setCurrentMediaIndex(0);

                // Preview the first media file
                setPreviewMedia(URL.createObjectURL(validMediaFiles[0]));

            } else {
                // Handle the case where no valid media files were selected
                alert('Please select valid media files (images or videos).');
            }
        }
    };


    const handleNextMedia = () => {
        setCurrentMediaIndex((prevIndex) => (prevIndex + 1));
        setPreviewMedia(URL.createObjectURL(uploadedMedia[currentMediaIndex + 1]));
    };

    const handlePreviousMedia = () => {
        setCurrentMediaIndex((prevIndex) => (prevIndex - 1));
        setPreviewMedia(URL.createObjectURL(uploadedMedia[currentMediaIndex - 1]));
    };

    const handleMediaUpload = (event) => {
        // Trigger the file input click when the user clicks on the "Upload Media" area
        console.log("helek")
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/* video/*'; // Set the accepted file types as needed
        fileInput.multiple = true; // Allow multiple file selection
        fileInput.click();
        fileInput.addEventListener('change', handleSelectedMedia);
    };



    const handleSubmit = async (event) => {
        event.preventDefault();

        // Check if either content or media is provided
        if (!content && uploadedMedia.length === 0) {
            alert('Please provide either text or media.');
            return;
        }

        // Assuming 'content' and 'uploadedMedia' are variables containing your data
        const formData = new FormData();
        formData.append('text', content); // Replace with your actual content data
        // Append each media file to the form data
        uploadedMedia.forEach((file, index) => {
            formData.append(`media[]`, file);
        });

        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        try {
            const response = await axios.post(`${API_BASE_URL}api/apps/timeline/post/create-post/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Token ${token}`,
                }
            });
            console.log(response.data)
            // Post created successfully, close the overlay and navigate to the new post's page
            navigate(`/timeline/post/${response.data.id}`);
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };


    const handleContentChange = (event) => {
        setContent(event.target.value);
    };

    const renderMediaContent = (uploadedMediaThis, onEnded) => {
        // console.log(uploadedMediaThis[currentMediaIndex].type);
        // console.log(uploadedMediaThis[currentMediaIndex].type.includes('video'));
        // console.log(currentMediaIndex);
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
                    url={`http://10.0.0.85:3000`}
                />
            );
        } else {
            return (
                <img src={previewMedia} alt={uploadedMediaThis.id} />
            );
        }
    };

    return (
        <div className='create-post-page'>
            <div className='create-post-page-inner'>
                <div className='create-post-page-header'>
                    <div className='create-post-page-header-inner'>
                        <h2>Create Post</h2>
                    </div>
                </div>
                <div className='create-post-page-inner-inner'>
                    <div className='create-post-page-inner-inner'>
                        <div className='create-post-page-textarea'>
                            <div className='create-post-page-textarea-inner'>
                                <textarea
                                    ref={textAreaRef}
                                    value={content}
                                    onChange={() => handleContentChange()}
                                    placeholder="Write your post here..."
                                ></textarea>
                            </div>
                            <div className='create-post-page-submit-button'>
                                <button onClick={(e) => handleSubmit(e)}>
                                    Post
                                </button>
                            </div>
                        </div>
                        <div className='create-post-page-upload-media-container'>
                            <div className='create-post-page-upload-media-container-inner'  onClick={() => handleMediaUpload()}>
                                <div className="page-upload-icon" onClick={() => handleMediaUpload()}>
                                    <p>+</p>
                                </div>
                                <div className="page-upload-text" onClick={() => handleMediaUpload()}>
                                    Upload Media
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='create-post-page-right'>
                    <div className='create-post-page-show-media-container'>
                        <div className='create-post-page-show-media-container-inner'>
                            {uploadedMedia.length !== 0 ? (
                                <div className={`page-uploaded-media-card`} onClick={(e) => e.stopPropagation()}>
                                    <div className={`create-post-previous-next-media-buttons`}>
                                        <div className={`create-post-page-previous-media-button${uploadedMedia[currentMediaIndex].type.includes('video') ? '-video' : ''}`}>
                                            {currentMediaIndex !== 0 &&
                                                <button onClick={handlePreviousMedia}>
                                                    <FontAwesomeIcon icon={faChevronLeft} />
                                                </button>
                                            }
                                        </div>
                                        <div className={`create-post-page-next-media-button${uploadedMedia[currentMediaIndex].type.includes('video') ? '-video' : ''}`}>
                                            {currentMediaIndex !== (uploadedMedia.length - 1) &&
                                                <button onClick={handleNextMedia}>
                                                    <FontAwesomeIcon icon={faChevronRight} />
                                                </button>
                                            }
                                        </div>
                                    </div>
                                    {/* Display the uploaded media here */}
                                    {uploadedMedia.length > 0 && (
                                        <div className={`create-post-page-media-display`}>
                                            {renderMediaContent(uploadedMedia, null)}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
        </div>
    );
}

export default CreatePost;