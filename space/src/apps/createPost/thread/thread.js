import React, { useRef, useState } from 'react';
import './thread.css';
import { FaEllipsisV, FaUpload } from 'react-icons/fa';

const Thread = ({ showpostEditorToolbar, setShowpostEditorToolbar, handleButtonClick }) => {
    const [postType, setpostType] = useState("idea");

    const handlepostTypeChange = (e) => setpostType(e.target.value);

    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    
    const handleSelectedMedia = (event) => {
        const selectedFiles = Array.from(event.target.files).filter(
            (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
        );
        setUploadedFiles((prev) => [...prev, ...selectedFiles]);
        setPreviewMedia(URL.createObjectURL(selectedFiles[0]));
        setCurrentMediaIndex(0);
    }
    const handleMediaUploadFn = () => {
        console.log(uploadedFiles);
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*, video/*';
        fileInput.multiple = true;
        fileInput.click();
        fileInput.addEventListener('change', (e) => handleSelectedMedia(e));
    };
    

    return (
        <div className="create-post-actions-menubar">
            <div className="create-post-actions-menubar-inner">
                <div className="create-post-menu-btn" onClick={handleButtonClick}>
                    <label>
                        <FaUpload className="icon-style" />
                    </label>
                </div>
                <div className="create-post-menu-btn" id="create-post-menu-btn-selector">
                    <select value={postType} onChange={handlepostTypeChange}>
                        <option disabled value="idea">Select Type</option>
                        <option value="announcement">Announcement</option>
                        <option value="announcement">Leaning Opinon</option>
                        <option value="idea">Thought</option>
                        <option value="question">Question</option>
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
    );
}

export default Thread;