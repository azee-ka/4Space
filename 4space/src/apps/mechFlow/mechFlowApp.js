import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from '../../general/components/Authentication/utils/AuthProvider';

import MechFlowLayout from './mechFlowLayout/mechFlowLayout';

import MechFlow from './pages/mechFlow/mechFlow';

const MechFlowApp = () => {
  const { isAuthenticated } = useAuthDispatch();

  const privateRoutes = [
    {
      path: '',
      name: 'MechFlow',
      element: <MechFlow />,
      showSidebar: true,
      showNavbar: true,
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
                <MechFlowLayout
                  className={`${route.path.substring(1)}`}
                  pageName={route.name}
                  showSidebar={route.showSidebar}
                  showNavbar={route.showNavbar}
                >
                  {route.element}
                </MechFlowLayout>
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


export default MechFlowApp;
