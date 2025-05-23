import React, { useEffect, useState } from 'react';
import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // assuming your auth hook exists
import Layout from '../struct/layout/layout';
import { useMemo } from 'react';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import LoginPage from '../pages/auth/Login/login';
import RegisterPage from '../pages/auth/Register/register';

import FrontPage from '../pages/frontPage/frontpage';

import Profile from '../pages/profile/profile';
import Settings from '../pages/settings/settings';

import { PostProvider } from '../context/PostContext';
import { CreatePostProvider } from '../context/CreatePostContext';
import { EditorProvider } from '../utils/editor/EditorContext';
import Messages from '../pages/messages/messages';
import { ReportOverlayProvider } from '../context/ReportOverlayContext';

import Timeline from '../apps/home/timeline/timeline';
import CreatePost from '../apps/home/createPost/createPost';
import Dashboard from '../apps/home/dashboard/dashboard';
import Explore from '../apps/home/explore/explore';

import CommunitiesTimeline from '../apps/communities/timeline/timline';
import Community from '../apps/communities/community/community';
import CommunitiesDashboard from '../apps/communities/dashboard/dashboard';
import { ModeProvider } from '../context/modeContext';
import ExpandPost from '../components/postUI/expandPost/expandPost';
import CreateCommunity from '../apps/communities/createCommunity/createCommunity';
import Post from '../apps/home/post/post';
import ExchangeDetail from '../apps/communities/community/tabs/general/discussionBoard/exchangeDetail/exchangeDetail';


const AppRouter = () => {
    const { authState, isLoading } = useAuth();
    const isAuthenticated = authState.isAuthenticated;

    const privateRoutes = [
        // Home
        { name: 'Dashboard', path: '/dashboard', component: <Dashboard />, key: 'Dashboard' },
        { name: 'Timeline', path: '/', component: <Timeline />, key: 'Timeline' },
        { name: 'Timeline', path: '/timeline', component: <Timeline />, key: 'Timeline' },
        { name: 'Explore', path: '/explore', component: <Explore />, key: 'Explore' },
        { name: 'Create Post', path: '/create/post', component: <CreatePost />, key: 'CreatePost' },
        { name: 'Expand Post', path: '/posts/p/:postId', component: <Post />, key: 'ExpandPost' },

        // Communities
        { name: 'Community Dasboard', path: '/communities', component: <CommunitiesDashboard />, key: 'Communities Dashboard' },
        { name: 'Community Dasboard', path: '/communities/dashboard', component: <CommunitiesDashboard />, key: 'Communities Dashboard' },
        { name: 'Communities Timeline', path: '/communities/timeline', component: <CommunitiesTimeline />, key: 'Communities Timline' },
        { name: 'Community', path: '/communities/c/:communityId', component: <Community />, key: 'Community' },
        { name: 'Community Exchange', path: '/communities/e/:exchangeId', component: <ExchangeDetail />, key: 'ExchangeDetail' },
        { name: 'Create Community', path: '/communities/create', component: <CreateCommunity />, key: 'CreateCommunity' },

        
        { name: 'Profile', path: '/profile/:username', component: <Profile />, key: 'Profile' },
        { name: 'My Profile', path: '/profile', component: <Profile />, key: 'MyProfile' },
        { name: 'Settings', path: '/settings', component: <Settings />, key: 'Settings' },

        { name: 'Messages', path: '/messages', component: <Messages />, key: 'Messages' },
        { name: 'Messages', path: '/messages/inbox', component: <Messages />, key: 'Messages' },
        { name: 'Messages', path: '/messages/requests', component: <Messages />, key: 'Messages' },
        { name: 'Messages', path: '/messages/inbox/c/:conversationId', component: <Messages />, key: 'Messages' },
        { name: 'Messages', path: '/messages/requests/c/:conversationId', component: <Messages />, key: 'Messages' },
    ];

    const publicRoutes = [
        { name: 'Login', path: '/login', component: <LoginPage />, key: 'Login' },
        { name: 'Register', path: '/register', component: <RegisterPage />, key: 'Register' },
        { name: 'Home', path: '/', component: <FrontPage />, key: 'FrontPage' },
        { name: 'Home', path: '/home', component: <FrontPage />, key: 'FrontPage' },
    ];


    if (isLoading) {
        return <div>Loading...</div>;
    }

    const renderPrivateRoutes = () => {
        return privateRoutes.map((route, index) => {
            const Component = route.component;
            return (
                <Route
                    key={`${index}-${route.path}`}
                    path={route.path}
                    element={
                        <Layout
                            key={`${index}-${route.path}`}
                            className={route.path.substring(1)}
                            pageName={route.pageName}
                        >
                            {Component}
                        </Layout>
                    }
                />
            );
        });
    };

    return (
        <Router>
            <DndProvider backend={HTML5Backend}>
            <ModeProvider>
                <ReportOverlayProvider>
                    <EditorProvider>
                        <PostProvider>
                            <CreatePostProvider>
                                <React.Suspense fallback={<div>Loading...</div>}>
                                    <Routes>
                                        {/* Public Routes (Accessible by everyone) */}
                                        {!isAuthenticated && publicRoutes.map((route, index) => {
                                            const Component = route.component;
                                            return (
                                                <Route
                                                    key={`${index}-${route.path}`}
                                                    path={route.path}
                                                    element={
                                                        <Layout
                                                            key={`${index}-${route.path}`}
                                                            className={`${route.path.substring(1)}`}
                                                            pageName={route.pageName}
                                                        >
                                                            {Component}
                                                        </Layout>
                                                    }
                                                />
                                            );
                                        })}

                                        {/* Private Routes (Accessible only by authenticated users) */}
                                        {isAuthenticated && renderPrivateRoutes()}


                                        {/* If not authenticated, redirect to login page */}
                                        {!isAuthenticated && (
                                            <Route path="/*" element={<Navigate to="/login" />} />
                                        )}

                                        {/* If authenticated, allow access to private routes */}
                                        {isAuthenticated && (
                                            <Route path="/*" element={<Navigate to="/" />} />
                                        )}
                                    </Routes>
                                </React.Suspense>
                            </CreatePostProvider>
                        </PostProvider>
                    </EditorProvider>
                </ReportOverlayProvider>
                </ModeProvider>
            </DndProvider>
        </Router>
    );
};

export default AppRouter;
