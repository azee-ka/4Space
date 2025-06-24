// src/pages/Auth/Register/register.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import API_BASE_URL from '../../../utils/apiUrl';
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaGithub, FaApple } from 'react-icons/fa';
import OrganizationalRegister from './organization/organization';
import './register.css';
import GitHubLoginButton from '../third_party_buttons/GitHubLoginButton';
import GoogleCustomButton from '../third_party_buttons/GoogleCustomButton';
import AppleSignInButton from '../third_party_buttons/AppleSignInButton';
import useRedirector from '../../../hooks/useRedirector';
import { MicrosoftIcon } from '../Login/login';

const USERNAME_REGEX = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])$/;

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { goBack } = useRedirector();

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

  // validation flags
  const lengthValid = username.length >= 3 && username.length <= 30;
  const startValid  = /^[A-Za-z0-9]/.test(username);
  const endValid    = /[A-Za-z0-9]$/.test(username);
  const charsValid  = /^[A-Za-z0-9._-]+$/.test(username);

  const handleContinue = e => {
    e.preventDefault();
    if (!USERNAME_REGEX.test(username)) return;
    if (!password) {
      setRegisterError('Password cannot be empty.');
      return;
    }
    setRegisterError(null);
    setStep(2);
  };

  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

  const handleSubmit = async e => {
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
      const res = await axios.post(`${API_BASE_URL}api/register/`, data, config);
      login(res.data, { switchTo: !isAddAccount });
      goBack('/timeline');
    } catch (err) {
      setRegisterError(err?.response?.data?.message || 'Registration failed.');
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


  if (isOrganizationRegisterPage) return <OrganizationalRegister />;

  return (
    <div className="register-auth-container">
      {/* Main form card */}
      <div className="register-auth-card">
        <h1 className="register-title">Create Account</h1>

        {step === 1 ? (
          <form className="register-form" onSubmit={handleContinue}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />

            <div className="register-password-field-container">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setRegisterError(null);
                }}
                required
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={handlePasswordToggle}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              className="step-button"
              disabled={!(lengthValid && startValid && endValid && charsValid && password)}
            >
              Continue
            </button>

            {registerError && (
              <p className="register-error-display">{registerError}</p>
            )}
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-card-full-name">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="date"
              placeholder="Date of Birth (optional)"
              value={dob}
              onChange={e => setDob(e.target.value)}
            />
            <button type="submit" className="step-button">
              Create Account
            </button>
            {registerError && (
              <p className="register-error-display">{registerError}</p>
            )}
          </form>
        )}

        <div className="register-oauth-divider">OR</div>

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

        <div className="redirect-to-login">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>

<div className='register-requiremnts-card'>
      {/* Checklist card */}
{step === 1 && username.length > 0 && (
  <div className="register-auth-card checklist-card">
    <h4 className="checklist-title">Username Requirements</h4>
    <ul className="checklist-list">
      <li className={lengthValid ? 'valid' : 'invalid'}>
        {lengthValid ? <FaCheck /> : <FaTimes />} Must be 3–30 characters
      </li>
      <li className={startValid ? 'valid' : 'invalid'}>
        {startValid ? <FaCheck /> : <FaTimes />} Start with a letter or number
      </li>
      <li className={endValid ? 'valid' : 'invalid'}>
        {endValid ? <FaCheck /> : <FaTimes />} End with a letter or number
      </li>
      <li className={charsValid ? 'valid' : 'invalid'}>
        {charsValid ? <FaCheck /> : <FaTimes />} Only letters, numbers, <code>.</code>, <code>_</code>, or <code>-</code>
      </li>
    </ul>
  </div>
)}

{/* Password checklist card */}
{step === 1 && password.length > 0 && (
  <div className="register-auth-card checklist-card">
    <h4 className="checklist-title">Password Requirements</h4>
    <ul className="checklist-list">
      <li className={password.length >= 8 ? 'valid' : 'invalid'}>
        {password.length >= 8 ? <FaCheck /> : <FaTimes />} At least 8 characters
      </li>
      <li className={/[A-Z]/.test(password) ? 'valid' : 'invalid'}>
        {/[A-Z]/.test(password) ? <FaCheck /> : <FaTimes />} One uppercase letter
      </li>
      <li className={/[a-z]/.test(password) ? 'valid' : 'invalid'}>
        {/[a-z]/.test(password) ? <FaCheck /> : <FaTimes />} One lowercase letter
      </li>
      <li className={/[0-9]/.test(password) ? 'valid' : 'invalid'}>
        {/[0-9]/.test(password) ? <FaCheck /> : <FaTimes />} One number
      </li>
      <li className={/[!@#$%^&*]/.test(password) ? 'valid' : 'invalid'}>
        {/[!@#$%^&*]/.test(password) ? <FaCheck /> : <FaTimes />} One special character (!@#$%^&*)
      </li>
    </ul>
  </div>
)}
</div>
    </div>
  );
};

export default RegisterPage;
