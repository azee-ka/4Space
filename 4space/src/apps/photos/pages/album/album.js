import React, { useEffect, useState } from "react";
import './album.css';
import axios from "axios";
import API_BASE_URL from "../../../../general/components/Authentication/utils/apiConfig";
import { useAuthState } from "../../../../general/components/Authentication/utils/AuthProvider";
import GetConfig from "../../../../general/components/Authentication/utils/config";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons';
import UploadingCard from "../uploadPhotos/uploadingCard/uploadingCard";

const Album = () => {
    const navigate = useNavigate();
    const { album_uuid } = useParams();
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [albumTitle, setAlbumTitle] = useState('');
    const [previousAlbumTitle, setPreviousAlbumTitle] = useState('');
    const [albumPhotos, setAlbumPhotos] = useState('');

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    const handleFetchAlbumMetaData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/apps/photos/get-album-data/${album_uuid}/`, config);
            console.log(response.data);
            setAlbumTitle(response.data.name);
            setPreviousAlbumTitle(response.data.name);
        } catch (error) {
            console.error('Error fetching photos:', error);
        }
    };

    const handleFetchAlbumMediaData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/apps/photos/get-album-photos/${album_uuid}/`, config);
            console.log(response.data);
            setAlbumPhotos(response.data);

        } catch (error) {
            console.error('Error fetching photos:', error);
        }
    };

    useEffect(() => {
        handleFetchAlbumMetaData();
        handleFetchAlbumMediaData();
    }, []);


    const handleAlbumTitleSubmit = async () => {
        if (albumTitle !== previousAlbumTitle) {
            try {
                const response = await axios.put(`${API_BASE_URL}/api/apps/photos/update-album-title/${album_uuid}/`, { title: albumTitle }, config);
                console.log(response.data);
                setPreviousAlbumTitle(albumTitle); // Update the previous album title
            } catch (error) {
                console.error('Error fetching photos:', error);
            }
        }
    }

    const handleBlur = () => {
        handleAlbumTitleSubmit();
    }


    const handleUpload = async (selectedFiles) => {
        if (selectedFiles.length === 0) {
            console.log('Please select at least one photo to upload.');
            return;
        }
    
        const formData = new FormData();
        console.log('formData', formData);

        selectedFiles.forEach(file => formData.append('photos', file));
    
        setUploading(true);
        console.log('formData', formData);

        try {
            const response = await axios.post(`${API_BASE_URL}api/apps/photos/upload-album-photos/${album_uuid}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Token ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const progressNow = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(progressNow); // Update progress state
                }
            });
            console.log('Upload response:', response.data);
            setSelectedFiles([]);
        } catch (error) {
            console.error('Upload error:', error);
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

    const handleGoBackToAlbumsPage = async () => {
        if(albumTitle === "Untitled Album" && albumPhotos.length === 0) {
            try {
                const response = await axios.delete(`${API_BASE_URL}/api/apps/photos/delete-album/${album_uuid}/`, config);
                console.log(response.data);
                // Redirect or perform any additional actions after successful deletion
            } catch (error) {
                console.error('Error deleting album:', error);
            }
        }
        navigate('/photos/albums');
    }

    return (
        <div className="album-page">
            <div className="album-page-inner">
                <div className="album-page-header">
                    <div className="album-page-header-inner">
                        <div className="album-go-back-button">
                            <button onClick={() => handleGoBackToAlbumsPage()}>
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                        </div>
                        <div className="album-add-photos-button">
                            <button>
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="album-page-content" onDrop={handleDrop} onDragOver={handleDragOver}>
                    <div className="album-page-content-inner">
                        <div className="album-page-album-title">
                            <input
                                value={albumTitle}
                                onChange={(e) => setAlbumTitle(e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>
                        {albumPhotos.length > 0 ? (
                        <div className="album-photos-container">

                        </div>
                    ) : (
                        <div className="album-drag-drop-photos-message">
                            <FontAwesomeIcon icon={faFileImport} />
                            <p>Drag and drop items here to upload</p>
                        </div>
                    )}
                    </div>
                    
                </div>
            </div>
            {uploading && <UploadingCard uploadedCount={selectedFiles.length} totalUploads={selectedFiles.length} progress={progress} selectedFiles={selectedFiles} />}
        </div>
    );
};

export default Album;