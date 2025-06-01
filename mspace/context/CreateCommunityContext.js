// context/CreateCommunityContext.js
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateCommunity from '../apps/communities/createCommunity/createCommunity';

const CreateCommunityContext = createContext();

export const CreateCommunityProvider = ({ children }) => {
  const [showCreateCommunityOverlay, setShowCreateCommunityOverlay] = useState(false);
  const [originalUrlBeforeCreateCommunityOverlay, setOriginalUrlBeforeCreateCommunityOverlay] = useState(null);
  const navigate = useNavigate();

  const openCreateCommunityOverlay = (originalPreviousUrl) => {
    setOriginalUrlBeforeCreateCommunityOverlay(originalPreviousUrl);
    setShowCreateCommunityOverlay(true);
  };

  const closeCreateCommunityOverlay = () => {
    setShowCreateCommunityOverlay(false);
    if (originalUrlBeforeCreateCommunityOverlay) {
      navigate(originalUrlBeforeCreateCommunityOverlay);
    } else {
      navigate('/communities');
    }
  };

  return (
    <CreateCommunityContext.Provider
      value={{
        showCreateCommunityOverlay,
        originalUrlBeforeCreateCommunityOverlay,
        openCreateCommunityOverlay,
        closeCreateCommunityOverlay,
      }}
    >
      {children}
      {showCreateCommunityOverlay && <CreateCommunity />}
    </CreateCommunityContext.Provider>
  );
};

export const useCreateCommunityContext = () => useContext(CreateCommunityContext);
