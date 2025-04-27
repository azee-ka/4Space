import React, { useEffect, useState } from 'react';
import { imageCompile } from './imageComplie';
// import './getProfilePicture.css';

const ImageWrapper = ({ src, onClick, className }) => {
    const imageSource = imageCompile(src);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };
    return (
        <img
            src={imageSource}
            alt={'image-icon'}
            onClick={handleClick}
            className={className || 'image-wrapper'}
        />
    );
};

export default ImageWrapper;
