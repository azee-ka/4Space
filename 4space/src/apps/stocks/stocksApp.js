import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from '../../general/components/Authentication/utils/AuthProvider';
// import './taskFlowApp.css';
import StocksLayout from './stocksLayout/stocksLayout';

import TradeView from './pages/tradeView/tradeView';
import ExploreStocks from './pages/explore/explore';

const StocksApp = () => {
    const { isAuthenticated } = useAuthDispatch();

    const privateRoutes = [
        {
            path: '/',
            element: <TradeView />,
            showSidebar: true,
            showNavbar: true,
        },
        {
            path: '/explore',
            element: <ExploreStocks />,
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
                                <StocksLayout
                                    className={`${route.path.substring(1)}`}
                                    pageName={route.name}
                                    showSidebar={route.showSidebar}
                                    showNavbar={route.showNavbar}
                                >
                                    {route.element}
                                </StocksLayout>
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


export default StocksApp;
