import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../components/Authentication/utils/apiConfig';

const MediaViewer = ({ src, mediaType }) => {
    const [mediaUrl, setMediaUrl] = useState(null);

    useEffect(() => {
        const fetchBlob = async () => {
            if (!src) return;

            try {
                const srcFinal = `${API_BASE_URL}${src}`
                const response = await fetch(srcFinal);
                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);
                setMediaUrl(objectURL);
            } catch (error) {
                console.error('Error fetching media as blob:', error);
            }
        };

        fetchBlob();
    }, [src]);

    if (!mediaUrl) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {mediaType === 'video' ? (
                <video controls src={mediaUrl} 
                // style={{ maxWidth: '100%', maxHeight: '100%' }}
                 />
            ) : (
                <img src={mediaUrl} alt="Media" 
                // style={{ maxWidth: '100%', maxHeight: '100%' }} 
                />
            )}
        </>
    );
};

export default MediaViewer;
