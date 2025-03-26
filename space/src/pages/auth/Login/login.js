// LoginForm.js
import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Import Axios
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './login.css';
import API_BASE_URL from '../../../utils/apiUrl';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    const [loginError, setLoginError] = useState('');



    const handleLoginSuccess = () => {
        navigate('/timeline');
    };

    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };


    
    // Handle form submission
    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${API_BASE_URL}api/login/`, {
                username,
                password,
            });
            console.log(response.data)
            login(response.data);
            handleLoginSuccess(response.data);
            // Handle successful login here, for example, update state or redirect
        } catch (error) {
            console.error('Error logging in:', error.message);
            // Handle the error as needed
            setLoginError((error.response.data && error.response.data.message) || (error.message));
        }
    };

    return (
        <div className="login-auth-container">
            <div className="login-auth-container-inner">
                <div className="login-auth-card">
                    <h2>Login</h2>
                    <form onSubmit={handleLoginSubmit}>
                        <div className='login-username-field-container'>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Username"
                                required
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className='login-password-field-container'>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                placeholder="Password"
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className='password-toggle-button-container'>
                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={handlePasswordToggle}
                                >
                                    <div className="eye-icon-container">
                                        {showPassword ? <FaEyeSlash className="eye-icon" /> : <FaEye className="eye-icon" />}
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className='redirect-to-register'>
                            <a href="/register">Don't have an account? Sign Up</a>
                        </div>

                        <button type="submit">Login</button>
                    </form>
                    <div className='login-error-display'>
                        <p>{loginError}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
