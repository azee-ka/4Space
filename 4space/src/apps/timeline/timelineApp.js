import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from '../../general/components/Authentication/utils/AuthProvider.js';
import './timelineApp.css';
import TimelineLayout from './timelineLayout/timelineLayout.js';

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

  const [postId, setPostId] = useState();
  const [previousLocation, setPreviousLocation] = useState('');

  const [showExpandPost, setShowExpandPost] = useState(false);

  const handleExpandPostTrigger = (post, previousLocation) => {
    setShowExpandPost(true);
    setPostId(post.id);
    setPreviousLocation(previousLocation);
  };


  const handlePrevPostClick = (prevPostId) => {
    console.log('prevPostId', prevPostId);
    setPostId(prevPostId);
    window.history.replaceState(null, '', `/post/${prevPostId}`);
    console.log(window.location.pathname)
}

const handleNextPostClick = (nextPostId) => {
    console.log('nextPostId', nextPostId);
    setPostId(nextPostId);
    window.history.replaceState(null, '', `/post/${nextPostId}`);
    console.log(window.location.pathname)
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
      element: <Profile handleUserListTrigger={handleUserListTrigger} handleExpandPostTrigger={handleExpandPostTrigger} />
    },
    {
      path: '/profile/:username',
      name: 'User Profile',
      element: <Profile handleUserListTrigger={handleUserListTrigger} handleExpandPostTrigger={handleExpandPostTrigger}/>
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
                    postId={postId}
                    previousLocation={previousLocation}
                    handlePrevPostClick={handlePrevPostClick}
                    handleNextPostClick={handleNextPostClick}
                    showExpandPost={showExpandPost}
                    setShowExpandPost={setShowExpandPost}
                    handleUserListTrigger={handleUserListTrigger}
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
