import React, { useEffect, useState } from 'react';
import './getProfilePicture.scss';
import { imageCompile } from '../imageWrapper/imageComplie';
import { ProfileImageCompile } from './profileImageCompile.';

const ProfilePicture = ({ src, onClick, className, isCommunity=false }) => {
    const profilePictureSrc = ProfileImageCompile(src, isCommunity);

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
