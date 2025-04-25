import React, { useState } from 'react';
import './visual.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationArrow, faUserTag, faUpload } from '@fortawesome/free-solid-svg-icons';

const Visual = React.forwardRef(({ onMediaSelect, mediaFiles }, ref) => {
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

    // Expose the getData method via the ref
    React.useImperativeHandle(ref, () => ({
        getData: () => ({
            type: 'Visual',
            mediaFiles: mediaFiles || [],
        }),
    }));

    return (
        <div className="visual-post-fields">
            <div className='card-container-btn' onClick={handleMediaUpload}>
                <FontAwesomeIcon icon={faUpload} className="icon-style" />
                <p>Upload Media</p>
                {mediaFiles?.length > 0 &&
                <div className="uploaded-media-count">
                     <p>{mediaFiles?.length} file(s) uploaded</p>
                </div>}
            </div>
            <div className='card-container-btn'>
                <FontAwesomeIcon icon={faUserTag} className="icon-style"/>
                <p>Tag User</p>
            </div>
            <div className='card-container-btn'>
                <FontAwesomeIcon icon={faLocationArrow} className="icon-style"/>
                <p>Tag Location</p>
            </div>
        </div>
    );
});

export default Visual;