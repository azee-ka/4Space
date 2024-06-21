import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from '../../general/components/Authentication/utils/AuthProvider.js';
import './timelineApp.css';
import TimelineLayout from './struct/timelineLayout/timelineLayout.js';

import Timeline from './pages/timeline/timeline.js';
import Profile from './pages/profile/profile.js';
import ExpandPostPage from './pages/post/expandedPost/expandPost/expandPostPage.js';
import CreatePost from './pages/post/createPost/createPost.js';
import Preferences from './pages/preferences/preferences.js';
import Messages from './pages/messages/messages.js';
import MyProfileEdit from './pages/profile/myProfileEdit/myProfileEdit.js';

const TimelineApp = () => {
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
    {
      path: '',
      name: 'Timeline',
      element: <Timeline />
    },
    {
      path: '/profile/edit',
      name: 'My Profile Edit',
      element: <MyProfileEdit handleUserListTrigger={handleUserListTrigger}/>
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


  return (
    <div className={`App ${isAuthenticated ? 'private' : ''}`}>
        <Routes>
          {isAuthenticated ? (
            privateRoutes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={
                  <TimelineLayout
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
                  </TimelineLayout>
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


export default TimelineApp;