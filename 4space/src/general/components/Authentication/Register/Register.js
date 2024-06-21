// Register.js
import React, { useState } from 'react';
import { useAuthDispatch } from '../utils/AuthProvider';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';
import API_BASE_URL from '../utils/apiConfig';

function Register() {
    const navigate = useNavigate();
    const { login } = useAuthDispatch();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        }
        const data = {
            first_name: firstName,
            last_name: lastName,
            username: username,
            email: email,
            password: password,
        };


        try {
            await axios.post(`${API_BASE_URL}/api/user/register/`, data, config);
            // Automatically login the user after successful registration
            await login(username, password);
            navigate('/timeline');
            // Redirect to a different page or show a success message
        } catch (error) {
            console.error('Registration failed', error);
        }
    };


    return (
        <div className='register-container'>
            <div className='register-form'>
                <h2>Register</h2>
                <form onSubmit={handleRegister}>
                    <div className='register-name-fields'>
                        <input
                            className='register-form-input'
                            type="text"
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <input
                            className='register-form-input'
                            type="text"
                            placeholder="Last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                    <input
                        className='register-form-input'
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className='register-form-input'
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className='register-form-input'
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className='redirect-to-login'>
                        <Link to={`/login`} >Already have an account?</Link>
                    </div>
                    <button type="submit">Register</button>
                </form>
            </div>
        </div>
    );
}
export default Register;
