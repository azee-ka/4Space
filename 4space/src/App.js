import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from './general/components/Authentication/utils/AuthProvider.js';
import './App.css';

import Login from './general/components/Authentication/Login/Login.js';
import Register from './general/components/Authentication/Register/Register.js';

import TimelineApp from './apps/timeline/timelineApp.js';
import PhotosApp from './apps/photos/photosApp.js';
import TaskFlowApp from './apps/taskFlow/taskFlowApp.js';
import SpectraApp from './apps/spectra/spectraApp.js';
import StocksApp from './apps/stocks/stocksApp.js';

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
              <Route path="/taskFlow/*" element={<TaskFlowApp />} />
              <Route path="/spectra/*" element={<SpectraApp />} />
              <Route path="/stocks/*" element={<StocksApp />} />
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
