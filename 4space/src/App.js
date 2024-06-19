import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from './components/general/Authentication/utils/AuthProvider.js';
import './App.css';
import Layout from './struct/layout/layout.js';

import Login from './components/general/Authentication/Login/Login.js';
import Register from './components/general/Authentication/Register/Register.js';

import MechFlow from './apps/mechFlow/mechFlow.js';
import Profile from './components/timeline/profile/profile.js';

import ExpandPostPage from './components/timeline/post/expandedPost/expandPost/expandPostPage.js';
import CreatePost from './components/timeline/post/createPost/createPost.js';
import Preferences from './components/general/preferences/preferences.js';
import Messages from './components/timeline/messages/messages.js';

const App = () => {
  const { isAuthenticated } = useAuthDispatch();

  const [showUserList, setShowUserList] = useState(false);
  const [userList, setUserList] = useState([]);
  const [userListTitle, setUserListTitle] = useState('');

  const [showExpandedPostOverlay, setShowExpandedPostOverlay] = useState(false);
  const [expandPostPreviousLocation, setExpandPostPreviousLocation] = useState('');

  const [expandPostId, setExpandPostId] = useState('');
  const [expandPrevPostId, setExpandPrevPostId] = useState('');
  const [expandNextPostId, setExpandNextPostId] = useState('');

  const handleShowExpandedOverlayPost = (post_id, expand_post_previous_location, prevPostId, nextPostId) => {
      setShowExpandedPostOverlay(true);
      setExpandPostId(post_id);
      setExpandPrevPostId(prevPostId);
      setExpandNextPostId(nextPostId);
      setExpandPostPreviousLocation(expand_post_previous_location);
  }

  const handleUserListTrigger = (userListParam, titleParam) => {
    setShowUserList(true);
    setUserList(userListParam);
    setUserListTitle(titleParam);
  };

  const privateRoutes = [
    // MechFlow
    {
      path: '/mechflow',
      name: 'Mech Flow',
      element: <MechFlow />
    },
    {
      path: '/profile',
      name: 'Profile',
      element: <Profile handleUserListTrigger={handleUserListTrigger} handleShowExpandedOverlayPost={handleShowExpandedOverlayPost} />
    },
    {
      path: '/profile/:username',
      name: 'User Profile',
      element: <Profile handleUserListTrigger={handleUserListTrigger} handleShowExpandedOverlayPost={handleShowExpandedOverlayPost} />
    },
    {
      path: '/createPost',
      name: 'Create Post',
      element: <CreatePost />
    },
    {
      path: '/post/:post_id',
      name: 'Post',
      element: <ExpandPostPage />
    },
    {
      path: '/preferences',
      name: 'Preferences',
      element: <Preferences />
    },
    {
      path: '/messages',
      name: 'Messages',
      element: <Messages />
    },
    {
      path: '/messages/requests/recieved',
      name: 'Messages',
      element: <Messages />
    },
    {
      path: '/messages/requests/sent',
      name: 'Messages',
      element: <Messages />
    },
    {
      path: '/messages/:uuid',
      name: 'Messages',
      element: <Messages />
    },
  ];

  const publicRoutes = [
    { path: '/login', name: 'Login', element: <Login /> },
    { path: '/register', name: 'Register', element: <Register /> },
  ];

  return (
    <div className={`App ${isAuthenticated ? 'private' : ''}`}>
      <Router>
        <Routes>
          {isAuthenticated ? (
            privateRoutes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={
                  <Layout
                    className={`${route.path.substring(1)}`}
                    pageName={route.name}
                    userList={userList}
                    userListTitle={userListTitle}
                    showUserList={showUserList}
                    setShowUserList={setShowUserList}
                    showExpandedPostOverlay={showExpandedPostOverlay}
                    setShowExpandedPostOverlay={setShowExpandedPostOverlay}
                    expandPostPreviousLocation={expandPostPreviousLocation}
                    postId={expandPostId}
                    prevPostId={expandPrevPostId}
                    nextPostId={expandNextPostId}
                    setPostId={setExpandPostId}
                    setPrevPostId={setExpandPrevPostId} 
                    setNextPostId={setExpandNextPostId}
                  >
                    {route.element}
                  </Layout>
                }
              />
            ))
          ) : (
            publicRoutes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={
                  <Layout 
                    className={`${route.path.substring(1)}`} 
                    pageName={route.name}
                  >
                    {route.element}
                  </Layout>
                }
              />
            ))
          )}
          <Route path="/*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </div>
  );
};


export default App;
