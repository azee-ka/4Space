import React from 'react';
import './uploadingCard.css';
import RingProgress from '../../../../../general/utils/ringProcess/ringProcess';

const UploadingCard = ({ uploadedCount, totalUploads, progress, selectedFiles }) => {

    return (
        <div className="uploading-card">
            <h2>Uploading Progress</h2>
            <div className="progress-bar-container" >
                <RingProgress progress={progress} />
            </div>
            <div className="upload-status">
                {uploadedCount} out of {totalUploads} uploaded
            </div>
            <div className="preview">
                {selectedFiles.map((file, index) => (
                    <img
                        key={index}
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="preview-image"
                    />
                ))}
            </div>
        </div>
    );
};

export default UploadingCard;
