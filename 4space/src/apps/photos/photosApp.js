import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from '../../general/components/Authentication/utils/AuthProvider';
import './photosApp.css';

import PhotosLayout from './photosLayout/photosLayout';

import PhotosPage from './pages/photosPage/photosPage';
import AlbumsPage from './pages/albumsPage/albumsPage';
import UploadPhotosPage from './pages/uploadPhotos/uploadPhotosPage';

const PhotosApp = () => {
  const { isAuthenticated } = useAuthDispatch();

  const privateRoutes = [
    {
      path: '',
      name: 'Photos',
      element: <PhotosPage />
    },
    {
        path: '/albums',
        name: 'Photos',
        element: <AlbumsPage />
      },
      {
        path: '/upload',
        name: 'Photos',
        element: <UploadPhotosPage />
      },

  ];


  return (
    <div className='photos-app'>
        <Routes>
          {isAuthenticated ? (
            privateRoutes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={
                  <PhotosLayout
                    className={`${route.path.substring(1)}`}
                    pageName={route.name}
                  >
                    {route.element}
                  </PhotosLayout>
                }
              />
            ))
          ) : (
            <Route path="/*" element={<Navigate to="/login" />} />
          )}
          <Route path="/*" element={<Navigate to="/login" />} />
        </Routes>
    </div>
  );
};


export default PhotosApp;
