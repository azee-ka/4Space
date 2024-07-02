import React, { useState, useEffect } from 'react';
import default_profile_picture from '../../../assets/default_profile_picture.png';
import API_BASE_URL from '../../../config';
import './getProfilePicture.css';

const ProfilePicture = ({ src, onClick }) => {
    const [profilePictureSrc, setProfilePictureSrc] = useState(default_profile_picture);

    useEffect(() => {
        const fetchImageAsBlob = async (imageSrc) => {
            try {
                const response = await fetch(imageSrc);
                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);
                setProfilePictureSrc(objectURL);
            } catch (error) {
                console.error('Error fetching image as blob:', error);
                setProfilePictureSrc(default_profile_picture);
            }
        };

        let imageSrc = default_profile_picture;

        if (src) {
            if (typeof src === 'object' && src.profile_picture) {
                imageSrc = API_BASE_URL + src.profile_picture;
            } else if (typeof src === 'string' && src.includes('default_profile_picture')) {
                imageSrc = default_profile_picture;
            } else if (typeof src === 'string' && src.includes('http://')) {
                imageSrc = src;
            } else if (typeof src === 'string') {
                imageSrc = API_BASE_URL + src;
            } else if (src === null) {
                imageSrc = default_profile_picture;
            }
        } else if (src === null) {
            imageSrc = default_profile_picture;
        }

        fetchImageAsBlob(imageSrc);
    }, [src]);



    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <img
            src={profilePictureSrc}
            alt={'profile-icon'}
            onClick={handleClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }} // Set cursor to pointer if onClick is provided
            className='profile-picture'
        />
    );
};

export default ProfilePicture;
