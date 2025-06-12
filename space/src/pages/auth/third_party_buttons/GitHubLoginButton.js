// components/GitHubLoginButton.js
import React from 'react';
import { FaGithub } from 'react-icons/fa';
import API_BASE_URL from '../../../utils/apiUrl';
import './github-button.css';

const GitHubLoginButton = () => {
  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}api/auth/github/login/`;
  };

  return (
    <button className="github-btn" onClick={handleLogin}>
      <FaGithub className="github-icon" />
      <span>Continue with GitHub</span>
    </button>
  );
};

export default GitHubLoginButton;
