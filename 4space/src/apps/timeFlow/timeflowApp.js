import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from '../../general/components/Authentication/utils/AuthProvider.js';
import './timeflowApp.css';
import TimeFlowLayout from './timeflowLayout/timeflowLayout.js';

import Timeflow from './pages/timeflow/timeflow.js';
import Profile from './pages/profile/profile.js';
import ExpandPostPage from './pages/post/expandedPost/expandPost/expandPostPage.js';
import CreatePost from './pages/post/createPost/createPost.js';
import Preferences from './pages/preferences/preferences.js';
import Messages from './pages/messages/messages.js';
import MyProfileEdit from './pages/profile/myProfileEdit/myProfileEdit.js';
import Explore from './pages/explore/explore.js';

const TimeFlowApp = () => {
  const { isAuthenticated } = useAuthDispatch();

  const [showUserList, setShowUserList] = useState(false);
  const [userList, setUserList] = useState([]);
  const [userListTitle, setUserListTitle] = useState('');

  const [postId, setPostId] = useState();
  const [previousLocation, setPreviousLocation] = useState('');

  const [showExpandPost, setShowExpandPost] = useState(false);

  const [expandPostCurrentIndex, setExpandPostCurrentIndex] = useState()
  const [postsList, setPostsList] = useState();

  const [showPreviousPostButton, setShowPreviousPostButton] = useState(true)
  const [showNextPostButton, setShowNextPostButton] = useState(true);


  const handleExpandPostTrigger = (postId, posts, index, previousLocation) => {
    setShowExpandPost(true);
    setPostId(postId);
    setPreviousLocation(previousLocation);

    setShowPreviousPostButton(index > 0);
    setShowNextPostButton(index < posts.length - 1);
    setExpandPostCurrentIndex(index);
    setPostsList(posts);
  };


  const handlePrevPostClick = () => {
    if (expandPostCurrentIndex > 0) {
      const newIndex = expandPostCurrentIndex - 1;
      handleExpandPostTrigger(postsList[newIndex].id, postsList, newIndex, previousLocation);
      setExpandPostCurrentIndex(newIndex);
    } else {
      setShowPreviousPostButton(false)
    }
  }

  const handleNextPostClick = () => {
    if (expandPostCurrentIndex < postsList.length - 1) {
      const newIndex = expandPostCurrentIndex + 1;
      handleExpandPostTrigger(postsList[newIndex].id, postsList, newIndex, previousLocation);
      setExpandPostCurrentIndex(newIndex);
    } else {
      setShowNextPostButton(false);
    }
  }


  const handleUserListTrigger = (userListParam, titleParam) => {
    setShowUserList(true);
    setUserList(userListParam);
    setUserListTitle(titleParam);
  };

  const privateRoutes = [
    {
      path: '',
      name: 'TimeFlow',
      element: <Timeflow handleUserListTrigger={handleUserListTrigger} handleExpandPostTrigger={handleExpandPostTrigger} />
    },
    {
      path: '/explore',
      name: 'Explore',
      element: <Explore handleExpandPostTrigger={handleExpandPostTrigger} />
    },
    {
      path: '/profile/edit',
      name: 'My Profile Edit',
      element: <MyProfileEdit handleUserListTrigger={handleUserListTrigger} />
    },
    {
      path: '/profile',
      name: 'Profile',
      element: <Profile handleUserListTrigger={handleUserListTrigger} handleExpandPostTrigger={handleExpandPostTrigger} />
    },
    {
      path: '/profile/:username',
      name: 'User Profile',
      element: <Profile handleUserListTrigger={handleUserListTrigger} handleExpandPostTrigger={handleExpandPostTrigger} />
    },
    {
      path: '/create-post',
      name: 'Create Post',
      element: <CreatePost />
    },
    {
      path: '/post/:post_id',
      name: 'Post',
      element: <ExpandPostPage handleUserListTrigger={handleUserListTrigger} />
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
                <TimeFlowLayout
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
                  showPreviousPostButton={showPreviousPostButton}
                  showNextPostButton={showNextPostButton}
                >
                  {route.element}
                </TimeFlowLayout>
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


export default TimeFlowApp;
