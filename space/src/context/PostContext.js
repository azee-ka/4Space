import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PostContext = createContext();

export const usePostContext = () => {
    return useContext(PostContext);
};

export const PostProvider = ({ children }) => {
    const navigate = useNavigate();
    const [expandPostIdReciever, setExpandPostIdReciever] = useState(null);
    const [currentExpandPostIndex, setCurrentExpandPostIndex] = useState(null);
    const [expandPostOnCloseUrl, setExpandPostOnCloseUrl] = useState(null);
    const [postsList, setPostsList] = useState([]);
    const [showPreviousPostButton, setShowPreviousPostButton] = useState(true);
    const [showNextPostButton, setShowNextPostButton] = useState(true);

    const [showPostMoreMenuOverlay, setShowPostMoreMenuOverlay] = useState(false);
    
    const handleExpandPostOpen = (postIdToExpand, posts, originalPreviousUrl, index) => {
        setExpandPostIdReciever(postIdToExpand);
        setShowPreviousPostButton(index > 0);
        setShowNextPostButton(index < posts.length - 1);
        setCurrentExpandPostIndex(index);
        setPostsList(posts);
        setExpandPostOnCloseUrl(originalPreviousUrl);
        window.history.replaceState(null, null, `/radianspace/flare/${postIdToExpand}`);
    };

    const handlePreviousPostClick = () => {
        if (currentExpandPostIndex > 0) {
            const newIndex = currentExpandPostIndex - 1;
            handleExpandPostOpen(postsList[newIndex].uuid, postsList, expandPostOnCloseUrl, newIndex);
            setCurrentExpandPostIndex(newIndex);
        } else {
            setShowPreviousPostButton(false);
        }
    };

    const handleNextPostClick = () => {
        if (currentExpandPostIndex < postsList.length - 1) {
            const newIndex = currentExpandPostIndex + 1;
            handleExpandPostOpen(postsList[newIndex].uuid, postsList, expandPostOnCloseUrl, newIndex);
            setCurrentExpandPostIndex(newIndex);
        } else {
            setShowNextPostButton(false);
        }
    };


    const handleExpandPostClose = () => {
        setExpandPostIdReciever(null);
        navigate(expandPostOnCloseUrl);
    };





    return (
        <PostContext.Provider
            value={{
                expandPostIdReciever,
                currentExpandPostIndex,
                expandPostOnCloseUrl,
                postsList,
                showPreviousPostButton,
                showNextPostButton,
                handleExpandPostOpen,
                handlePreviousPostClick,
                handleNextPostClick,
                handleExpandPostClose,
                setExpandPostIdReciever,
                showPostMoreMenuOverlay, 
                setShowPostMoreMenuOverlay,
            }}
        >
            {children}
        </PostContext.Provider>
    );
};
