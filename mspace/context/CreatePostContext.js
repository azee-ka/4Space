// context/CreatePostContext.js
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatePost from '../apps/home/createPost/createPost';

const CreatePostContext = createContext();

export const CreatePostProvider = ({ children }) => {
    const [showCreatePostOverlay, setShowCreatePostOverlay] = useState(false);
    const [originalUrlBeforeCreatePostOverlay, setOriginalUrlBeforeCreatePostOverlay] = useState(null);
    const navigate = useNavigate();

    const openCreatePostOverlay = (originalPreviousUrl) => {
            setOriginalUrlBeforeCreatePostOverlay(originalPreviousUrl);
            setShowCreatePostOverlay(true);
    };

    const closeCreatePostOverlay = () => {
        setShowCreatePostOverlay(false);
        if(originalUrlBeforeCreatePostOverlay) {
            navigate(originalUrlBeforeCreatePostOverlay);
        } else {
            navigate('/')
        }
    };

    return (
        <CreatePostContext.Provider
            value={{
                showCreatePostOverlay,
                originalUrlBeforeCreatePostOverlay,
                openCreatePostOverlay,
                closeCreatePostOverlay,
            }}
        >
            {children}
            {showCreatePostOverlay && <CreatePost />}
        </CreatePostContext.Provider>
    );
};

export const useCreatePostContext = () => useContext(CreatePostContext);
