import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import API_BASE_URL from '../../../utils/apiUrl';
import { FaApple, FaEye, FaEyeSlash, FaGithub } from 'react-icons/fa';
import './login.css';
import GoogleCustomButton from '../third_party_buttons/GoogleCustomButton';
import GitHubLoginButton from '../third_party_buttons/GitHubLoginButton';
import AppleSignInButton from '../third_party_buttons/AppleSignInButton';
import { OAuthButtons } from '../third_party_buttons/authButtons';
import useRedirector from '../../../hooks/useRedirector';



const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect fill="#F35325" x="1" y="1" width="10" height="10" />
    <rect fill="#81BC06" x="13" y="1" width="10" height="10" />
    <rect fill="#05A6F0" x="1" y="13" width="10" height="10" />
    <rect fill="#FFBA08" x="13" y="13" width="10" height="10" />
  </svg>
);


const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { goBack } = useRedirector();

  const isAddAccount = new URLSearchParams(location.search).get('from') === 'add-account';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}api/login/`, {
        username,
        password,
      });
      login(response.data, { switchTo: !isAddAccount });
      goBack();
    } catch (error) {
      setLoginError(error?.response?.data?.message || 'Login failed.');
    }
  };




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
    <div className="login-wrapper">

      <div className='login-card'>
        <form onSubmit={handleLoginSubmit} className="login-form">
          <h1 className="login-title">Welcome Back</h1>

          <input
            type="text"
            placeholder="Username"
            required
            className="login-input"
            onChange={(e) => setUsername(e.target.value)}
          />

          <div className="login-password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              className="login-input password-input"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="login-eye-button">
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {loginError && <div className="login-error">{loginError}</div>}

          <button type="submit" className="login-primary-button">Login</button>
        </form>

        <div className="login-oauth-divider">OR</div>

        <div className="oauth-button-group">
          <GoogleCustomButton />
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

        <div className="login-redirect">
          <Link to="/register">Don't have an account? Sign up</Link>
        </div>
      </div>
    </div>

  );
};

export default LoginPage;
