import React, { useState } from 'react';
import './visual.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';

const Visual = ({ onMediaSelect, mediaFileCount }) => {
    const handleSelectedMedia = (event) => {
        const selectedFiles = Array.from(event.target.files).filter(
            (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
        );
        if (selectedFiles.length > 0) {
            onMediaSelect(selectedFiles);
        }
    };

    const handleMediaUpload = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*, video/*';
        fileInput.multiple = true;
        fileInput.click();
        fileInput.addEventListener('change', (e) => handleSelectedMedia(e));
    };

    return (
        <div className="visual-post-fields">
            <div className="visual-post-upload">
                <div className='visual-post-upload-container' onClick={handleMediaUpload}>
                    <FontAwesomeIcon icon={faUpload} className="icon-style" />
                    <p>Upload Media</p>
                </div>
                <div className="uploaded-media-count">
                    {mediaFileCount > 0 && <p>{mediaFileCount} file(s) uploaded</p>}
                </div>
            </div>
        </div>
    );
};

export default Visual;
