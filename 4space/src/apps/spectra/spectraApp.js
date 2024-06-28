import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from '../../general/components/Authentication/utils/AuthProvider';
// import './taskFlowApp.css';
import SpectraLayout from './spectraLayout/spectraLayout';

import Home from './pages/home/home';

const SpectraApp = () => {
    const { isAuthenticated } = useAuthDispatch();

    const privateRoutes = [
        {
            path: '/',
            element: <Home />,
            showSidebar: true,
            showNavbar: true,
        },
    ];

    return (
        <div className='task-flow-app'>
            <Routes>
                {isAuthenticated ? (
                    privateRoutes.map((route, index) => (
                        <Route
                            key={index}
                            path={route.path}
                            element={
                                <SpectraLayout
                                    className={`${route.path.substring(1)}`}
                                    pageName={route.name}
                                    showSidebar={route.showSidebar}
                                    showNavbar={route.showNavbar}
                                >
                                    {route.element}
                                </SpectraLayout>
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


export default SpectraApp;
