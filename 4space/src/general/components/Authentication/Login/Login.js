// Login.js
import React, { useState } from 'react';
import { useAuthDispatch } from '../utils/AuthProvider';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuthDispatch();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        // Perform login logic
        await login(username, password);
        navigate('/timeline');
    };

    return (
        <div className='login-container'>
            <div className='login-form'>
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
                    <input
                        className='login-form-input'
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className='login-form-input'
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className='redirect-to-register'>
                        <Link to={`/register`} >Don't have an account?</Link>
                    </div>
                    <button className='login-form-button' type="submit">Login</button>
                </form>
            </div>
        </div>
    );
}

export default Login;
