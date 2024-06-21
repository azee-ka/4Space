import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from './general/components/Authentication/utils/AuthProvider.js';
import './App.css';

import Login from './general/components/Authentication/Login/Login.js';
import Register from './general/components/Authentication/Register/Register.js';

import TimelineApp from './apps/timeline/timelineApp.js';
import PhotosApp from './apps/photos/photosApp.js';

const App = () => {
  const { isAuthenticated } = useAuthDispatch();

  const publicRoutes = [
    { path: '/login', name: 'Login', element: <Login /> },
    { path: '/register', name: 'Register', element: <Register /> },
  ];

  return (
    <div className={`App ${isAuthenticated ? 'private' : ''}`}>
      <Router>
      <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/timeline/*" element={<TimelineApp />} />
              <Route path="/photos/*" element={<PhotosApp />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </Router>
    </div>
  );
};


export default App;
