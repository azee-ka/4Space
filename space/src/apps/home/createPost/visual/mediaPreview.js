import React, { useEffect, useState } from 'react';
import './mediaPreview.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faArrowLeft, faTrashAlt, faDownload, faPlus, faUpload, faSave, faDiagramNext, faArrowsDownToLine } from '@fortawesome/free-solid-svg-icons';
import VideoPlayer from '../../../../components/videoPlayer/videoPlayer';
import API_BASE_URL from '../../../../utils/apiUrl';
import { formatDateTime } from '../../../../utils/formatDateTime';

const MediaPreview = ({ mediaFiles, onBack }) => {
    const [uploadedMedia, setUploadedMedia] = useState([]);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [mediaMetaData, setMediaMetaData] = useState({}); // Store media metadata

    useEffect(() => {
        if (mediaFiles.length > 0) {
            setUploadedMedia(mediaFiles);
            setCurrentMediaIndex(0);
            setPreviewMedia(URL.createObjectURL(mediaFiles[0])); // Initialize previewMedia
            extractMetaData(mediaFiles[0]); // Extract metadata for the first file
        }
    }, [mediaFiles]);

    const extractMetaData = (file) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (file.type.includes("image")) {
                const img = new Image();
                img.onload = () => {
                    setMediaMetaData({
                        width: img.width,
                        height: img.height,
                        type: file.type,
                        name: file.name,
                        size: file.size,
                        uploadDate: file.lastModified ? formatDateTime(file.lastModified, true) : 'Unknown'
                    });
                };
                img.src = reader.result;
            } else if (file.type.includes("video")) {
                const videoElement = document.createElement("video");
                videoElement.onloadedmetadata = () => {
                    setMediaMetaData({
                        duration: videoElement.duration, // video duration
                        type: file.type,
                        name: file.name,
                        size: file.size,
                        uploadDate: file.lastModified ? formatDateTime(file.lastModified, true) : 'Unknown'
                    });
                };
                videoElement.src = reader.result;
            }
        };
        reader.readAsDataURL(file); // Load the file data
    };

    const handleNext = () => {
        setCurrentMediaIndex((prevIndex) => {
            const newIndex = prevIndex + 1;
            setPreviewMedia(URL.createObjectURL(uploadedMedia[newIndex]));
            extractMetaData(uploadedMedia[newIndex]); // Extract metadata for the next media
            return newIndex;
        });
    };

    const handlePrevious = () => {
        setCurrentMediaIndex((prevIndex) => {
            const newIndex = prevIndex - 1;
            setPreviewMedia(URL.createObjectURL(uploadedMedia[newIndex]));
            extractMetaData(uploadedMedia[newIndex]); // Extract metadata for the previous media
            return newIndex;
        });
    };


    const handleTemporarySave = () => {
        // Temporary save: You can save the uploaded media to the state in the parent component (CreatePost)
        onBack(uploadedMedia); // Passing the uploaded media back to the parent component
    };

    
    const handleDelete = () => {
        const updatedMedia = uploadedMedia.filter((_, index) => index !== currentMediaIndex);
        setUploadedMedia(updatedMedia);
        if (updatedMedia.length > 0) {
            setCurrentMediaIndex(0);
            setPreviewMedia(URL.createObjectURL(updatedMedia[0]));
        } else {
            setPreviewMedia(null);
        }
    };

    const handleDownload = () => {
        const currentMedia = uploadedMedia[currentMediaIndex];
        const link = document.createElement('a');
        link.href = URL.createObjectURL(currentMedia);
        link.download = currentMedia.name || 'media-file';
        link.click();
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        setUploadedMedia((prevMedia) => {
            const newMedia = [...prevMedia, ...files];
            setPreviewMedia(URL.createObjectURL(files[0])); // Preview the first new file
            extractMetaData(files[0]); // Extract metadata for the first new file
            return newMedia;
        });
    };

    const formatFileSize = (size) => {
        const units = ['Bytes', 'KB', 'MB', 'GB'];
        let i = 0;
        while (size >= 1024 && i < units.length - 1) {
            size /= 1024;
            i++;
        }
        return `${Math.round(size * 100) / 100} ${units[i]}`;
    };

    const renderMediaContent = () => {
        if (!previewMedia) return <div className='no-content'>No content to preview!</div>

        const mediaType = uploadedMedia[currentMediaIndex]?.type;

        if (mediaType?.includes('video')) {
            return (
                <VideoPlayer
                    mediaFile={previewMedia}
                    playable={true}
                    url={API_BASE_URL}
                />
            );
        } else {
            return <img src={previewMedia} alt={`Preview-${currentMediaIndex}`} />;
        }
    };

    return (
        <div className="media-preview-container">
            <div className="media-preview-header">
                <button className="media-preview-back" onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <h3>Preview</h3>
                <p className="media-preview-count">
                    {uploadedMedia.length > 1 ? `${currentMediaIndex + 1} of ${uploadedMedia.length}` : ''}
                </p>
            </div>

            <div className='media-preview-meta-header'>
                <div className="media-preview-meta-container">
  <div className="media-preview-meta">
    <div className="meta-item">
      <span className="meta-label">File Size:</span>
      <span className="meta-value">{formatFileSize(mediaMetaData.size)}</span>
    </div>
    <div className="meta-item">
      <span className="meta-label">Last Modified:</span>
      <span className="meta-value">{mediaMetaData.uploadDate}</span>
    </div>
    <div className="meta-item">
      <span className="meta-label">Dimensions:</span>
      <span className="meta-value">{mediaMetaData.width} x {mediaMetaData.height}</span>
    </div>
  </div>
</div>

                <div className="media-preview-btns-container">
                    <button className="save-btn" onClick={handleTemporarySave}>
                        <FontAwesomeIcon icon={faSave} className='icon-style' /> Continue
                    </button>
                    <button className="cancel-btn" onClick={onBack}>
                        <FontAwesomeIcon icon={faArrowLeft} className='icon-style' /> Cancel
                    </button>

                    <button onClick={handleDelete} className="delete-btn">
                        <FontAwesomeIcon icon={faTrashAlt} className='icon-style' /> Delete
                    </button>
                    <button onClick={handleDownload} className="download-btn">
                        <FontAwesomeIcon icon={faDownload} className='icon-style' /> Download
                    </button>
                    {/* Upload Button */}
                    <label htmlFor="upload-media" className="upload-btn">
                        <FontAwesomeIcon icon={faUpload} className='icon-style' /> Upload More
                    </label>
                    <input
                        id="upload-media"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <div className="media-preview-content">
                {uploadedMedia.length !== 0 &&
                <div className="media-preview-nav-container">
                    {currentMediaIndex > 0 ? (
                        <button className="media-preview-nav left" onClick={handlePrevious}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                    ) : <div></div>}
                    {currentMediaIndex < uploadedMedia.length - 1 && (
                        <button className="media-preview-nav right" onClick={handleNext}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    )}
                </div>
}
                {renderMediaContent()}
            </div>
        </div>
    );
};

export default MediaPreview;
