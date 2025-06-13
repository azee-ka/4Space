import React from 'react';
import { FaGithub, FaApple } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import API_BASE_URL from '../../../utils/apiUrl';
import './authButtons.css';

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect fill="#F35325" x="1" y="1" width="10" height="10" />
    <rect fill="#81BC06" x="13" y="1" width="10" height="10" />
    <rect fill="#05A6F0" x="1" y="13" width="10" height="10" />
    <rect fill="#FFBA08" x="13" y="13" width="10" height="10" />
  </svg>
);

export const OAuthButtons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const isAddAccount = new URLSearchParams(location.search).get('from') === 'add-account';

  const handleGitHub = () => {
    window.location.href = `${API_BASE_URL}api/auth/github/login/`;
  };

  const handleMicrosoft = () => {
    window.location.href = `${API_BASE_URL}api/auth/microsoft/login/`;
  };

  const handleApple = () => {
    try {
      window.AppleID?.auth?.signIn();
    } catch (e) {
      console.error('Apple login failed:', e);
    }
  };

  return (
    <div className="oauth-button-group">
      <button className="oauth-btn oauth-microsoft" onClick={handleMicrosoft}>
        <MicrosoftIcon />
        Continue with Microsoft Account
      </button>

      <button className="oauth-btn oauth-apple" onClick={handleApple}>
        <FaApple className="oauth-icon" />
        Continue with Apple
      </button>

      <button className="oauth-btn oauth-github" onClick={handleGitHub}>
        <FaGithub className="oauth-icon" />
        Continue with GitHub
      </button>
    </div>
  );
};
