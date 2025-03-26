import React, { useEffect, useState } from 'react';
import './getProfilePicture.css';
import { imageCompile } from '../imageWrapper/imageComplie';
import { ProfileImageCompile } from './profileImageCompile.';

const ProfilePicture = ({ src, onClick, className }) => {
    const profilePictureSrc = ProfileImageCompile(src);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <img
            src={profilePictureSrc}
            alt={'profile-picture-icon'}
            onClick={handleClick}
            className={className || 'profile-picture'}
        />
    );
};

export default ProfilePicture;
