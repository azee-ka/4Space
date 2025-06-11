// src/pages/Auth/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import API_BASE_URL from '../../../utils/apiUrl';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import GitHubButton from 'react-github-login-button';
import AppleLogin from 'react-apple-login';
import './login.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');

    const isAddAccount = new URLSearchParams(location.search).get('from') === 'add-account';

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_BASE_URL}api/login/`, {
                username,
                password,
            });
            login(response.data, { switchTo: !isAddAccount });
            navigate('/timeline');
        } catch (error) {
            setLoginError(error?.response?.data?.message || 'Login failed.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post(`${API_BASE_URL}api/auth/google/`, {
                token: credentialResponse.credential,
            });
            login(res.data, { switchTo: !isAddAccount });
            const handleGoogleSuccess = async (credentialResponse) => {
                try {
                    const res = await axios.post(`${API_BASE_URL}api/auth/google/`, {
                        token: credentialResponse.credential,
                    });
                    login(res.data, { switchTo: !isAddAccount });
                    navigate('/timeline');
                } catch (err) {
                    console.error(err);
                    setLoginError('Google login failed.');
                }
            };

            navigate('/timeline');
        } catch (err) {
            console.error(err);
            setLoginError('Google login failed.');
        }
    };

    const handleGitHubLogin = () => {
        window.location.href = `${API_BASE_URL}api/auth/github/login/`;
    };

    return (
        <div className="login-wrapper">
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
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="login-eye-button"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>

                {loginError && <div className="login-error">{loginError}</div>}

                <button type="submit" className="login-primary-button">Login</button>

                <div className="login-oauth-divider">OR</div>

                <div className="login-oauth-buttons">
                    <div className="oauth-btn-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setLoginError('Google login failed.')}
                        />
                    </div>

                    <div className="oauth-btn-wrapper">
                        <GitHubButton onClick={handleGitHubLogin} />
                    </div>

                    <div className="oauth-btn-wrapper">
                        <AppleLogin
                            clientId="com.your.bundle.id"
                            redirectURI="https://yourdomain.com/callback"
                            usePopup={true}
                            responseType="code"
                            disabled={true}
                        />
                    </div>
                </div>

                <div className="login-redirect">
                    <Link to="/register">Don't have an account? Sign up</Link>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
