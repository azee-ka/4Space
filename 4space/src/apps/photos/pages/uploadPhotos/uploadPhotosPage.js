import React, { useState } from 'react';
import axios from 'axios';
import './uploadPhotosPage.css'; // Create a CSS file for styling
import API_BASE_URL from '../../../../config';
import GetConfig from '../../../../general/components/Authentication/utils/config';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import UploadingCard from './uploadingCard/uploadingCard';

const UploadPhotosPage = () => {
    const { token } = useAuthState();
    const config = GetConfig(token);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => file.type.startsWith('image/'));

        if (validFiles.length !== files.length) {
            setError('Only image files are allowed.');
        } else {
            setError('');
        }

        setSelectedFiles(validFiles);
        handleUpload();
    };

    const handleUpload = async (selectedFiles) => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one photo to upload.');
            return;
        }
    
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('photos', file));
    
        setUploading(true);
        setError('');
        setSuccessMessage('');
    
        try {
            const response = await axios.post(`${API_BASE_URL}api/apps/photos/upload-photo/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Token ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const progressNow = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(progressNow); // Update progress state
                }
            });
            setSuccessMessage('Photos uploaded successfully.');
            console.log('Upload response:', response.data);
            setSelectedFiles([]);
        } catch (error) {
            console.error('Upload error:', error);
            setError('An error occurred while uploading photos. Please try again.');
        } finally {
            setUploading(false);
        }
    };
    

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        setSelectedFiles(files);
        handleUpload(files);
    };
    

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="upload-photos-page" onDrop={handleDrop} onDragOver={handleDragOver}>
            <h1>Upload Photos</h1>
            <div className='upload-photos-page-inner'>
                {uploading && <UploadingCard uploadedCount={selectedFiles.length} totalUploads={selectedFiles.length} progress={progress} selectedFiles={selectedFiles} />}
            </div>
            {error && <div className="error">{error}</div>}
            {successMessage && <div className="success">{successMessage}</div>}
            
        </div>
    );
};

export default UploadPhotosPage;
