// src/pages/Auth/Register/register.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import API_BASE_URL from '../../../utils/apiUrl';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import GitHubButton from 'react-github-login-button';
import AppleLogin from 'react-apple-login';
import OrganizationalRegister from './organization/organization';
import './register.css';
import GitHubLoginButton from '../third_party_buttons/GitHubLoginButton';
import GoogleCustomButton from '../third_party_buttons/GoogleCustomButton';
import AppleSignInButton from '../third_party_buttons/AppleSignInButton';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState(null);

  const isOrganizationRegister = location.hash === '#organization';
  const [isOrganizationRegisterPage, setIsOrganizationRegisterPage] = useState(isOrganizationRegister);
  const isAddAccount = new URLSearchParams(location.search).get('from') === 'add-account';

  useEffect(() => {
    setIsOrganizationRegisterPage(location.hash === '#organization');
  }, [location.hash]);

  const handlePasswordToggle = () => setShowPassword(!showPassword);

  const handleContinue = (e) => {
    e.preventDefault();
    if (username && password) setStep(2);
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const data = {
        type: 'individual',
        username,
        password,
        email,
        first_name: capitalize(firstName),
        last_name: capitalize(lastName),
        dob: dob || null,
      };
      const response = await axios.post(`${API_BASE_URL}api/register/`, data, config);
      login(response.data, { switchTo: !isAddAccount });
      navigate('/timeline');
    } catch (error) {
      setRegisterError(error?.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="register-auth-container">
      {isOrganizationRegisterPage ? (
        <OrganizationalRegister />
      ) : (
        <div className="register-auth-card">
          <h1 className="register-title">Create Account</h1>
          <form onSubmit={step === 1 ? handleContinue : handleSubmit}>
            {step === 1 ? (
              <>
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <div className="register-password-field-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-button"
                    onClick={handlePasswordToggle}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <button type="submit" className="step-button">Continue</button>
              </>
            ) : (
              <>
                <div className="register-card-full-name">
                  <input
                    type="text"
                    placeholder="First Name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="date"
                  placeholder="Date of Birth (optional)"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
                <button type="submit" className="step-button">Create Account</button>
              </>
            )}
          </form>

          <div className="register-oauth-divider">OR</div>
          <div className="register-oauth-buttons">
            <div className="oauth-btn-wrapper">
              <GoogleCustomButton />
            </div>
            <div className="oauth-btn-wrapper">
              <GitHubLoginButton />
            </div>
            <div className="oauth-btn-wrapper">
              <AppleSignInButton />
            </div>
          </div>

          <div className="redirect-to-login">
            <Link to="/login">Already have an account? Login</Link>
          </div>

          {registerError && <p className="register-error-display">{registerError}</p>}
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
