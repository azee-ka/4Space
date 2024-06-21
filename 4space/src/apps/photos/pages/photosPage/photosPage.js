import React, { useState, useEffect } from "react";
import axios from 'axios';
import './photosPage.css';
import API_BASE_URL from "../../../../general/components/Authentication/utils/apiConfig";
import GetConfig from "../../../../general/components/Authentication/utils/config";
import { useAuthState } from "../../../../general/components/Authentication/utils/AuthProvider";
import { formatDate } from "../../../../general/utils/formatDate";

const PhotosPage = () => {
    const { token } = useAuthState()
    const config = GetConfig(token);
    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState('');

    const fetchPhotos = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/apps/photos/get-all-photos/`, config);
            setPhotos(response.data);
            console.log(response.data);
        } catch (error) {
            console.error('Error fetching photos:', error);
            setError('Error fetching photos. Please try again.');
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, []);

    const handleRenderMedia = (media) => {
        if(media){ 
        if (media.media_type === "image") {
            return <img src={`${API_BASE_URL}${media.file}`} alt="Photo" />;
        } else if (media.media_type === "video") {
            return <video src={`${API_BASE_URL}${media.file}`} controls />;
        } else {
            return <p>Unsupported media type</p>;
        }
    }
    };

    return (
        <div className="photos-page">
            <div className="photos-page-inner">
                <div className="photos-page-header">
                    <h2>Photos</h2>
                </div>
                <div className="photos-page-content">
                    <div className="photo-grid">
                        {photos.map((photosGroup, index) => (
                            <div key={index} className="photo-each-group">
                                <div className="photo-group-date">
                                    <p>{formatDate(photosGroup.date, false, true, true)}</p>
                                </div>
                                <div className="photo-group-grid">
                                    {photosGroup.photos.map((photo, index) => (
                                        <div key={index} className="photo-item">
                                            {handleRenderMedia(photo.media)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default PhotosPage;
