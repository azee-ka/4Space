import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import API_BASE_URL from '../../../utils/apiUrl';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './login.css';
import GoogleCustomButton from '../third_party_buttons/GoogleCustomButton';
import GitHubLoginButton from '../third_party_buttons/GitHubLoginButton';
import AppleSignInButton from '../third_party_buttons/AppleSignInButton';
import { OAuthButtons } from '../third_party_buttons/authButtons';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

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
            navigate('/timeline');
        } catch (error) {
            setLoginError(error?.response?.data?.message || 'Login failed.');
        }
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

                <OAuthButtons />

                <div className="login-redirect">
                    <Link to="/register">Don't have an account? Sign up</Link>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
