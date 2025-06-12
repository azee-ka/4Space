import React from 'react';
import { FaGithub } from 'react-icons/fa';
import API_BASE_URL from '../../../utils/apiUrl';
import './github-button.css';

const GitHubLoginButton = () => {
  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}api/auth/github/login/`;
  };

  return (
    <button className="oauth-btn github-btn" onClick={handleLogin}>
  <div className="oauth-btn-state"></div>
  <div className="oauth-btn-content-wrapper">
    <div className="oauth-btn-icon">
      <FaGithub className="oauth-icon-svg" />
    </div>
    <span className="oauth-btn-text">Continue with GitHub</span>
  </div>
</button>

  );
};

export default GitHubLoginButton;
