import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './organization.css'; // optional
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useApi from '../../../../utils/useApi';
import { useAuth } from '../../../../hooks/useAuth';
import axios from 'axios';
import API_BASE_URL from '../../../../utils/apiUrl';

const roles = ['Admin', 'Member'];

const OrganizationalRegister = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const { login } = useAuth();
    const { callApi } = useApi();

    const [tempAuthData, setTempAuthData] = useState(null);

    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [registerError, setRegisterError] = useState(null);

    const isAddAccount = new URLSearchParams(location.search).get('from') === 'add-account';


    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        selectedRole: '',
        orgName: '',
        orgSlug: '',
        orgDomain: '',
        orgType: '',
        requireDomainEmail: false,
        inviteCode: '',
        searchOrg: '',
    });

    const handleNext = () => {
        if (step === 2 & !formData.selectedRole) return;
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step - 1 === 2) {
            handleDeleteAccount();
        }
        setStep(step - 1);
    };


    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const handleDeleteAccount = async () => {
        // Handle account deletion logic here
        console.log('Account deleted');
        try {
            const response = await callApi('user/delete/', 'DELETE', null, 'application/json', tempAuthData);
            console.log(response.data);
            // Handle successful account deletion here
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };
    // Handle form submission
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            // Capitalize first letter of first and last names
            const capitalizedFirstName = capitalizeFirstLetter(formData.firstName);
            const capitalizedLastName = capitalizeFirstLetter(formData.lastName);

            const data = {
                type: 'organization',
                org_role: formData.selectedRole,
                username: formData.username,
                password: formData.password,
                email: formData.email,
                first_name: capitalizedFirstName,
                last_name: capitalizedLastName,
            };
            // Send registration data to the backend
            const response = await axios.post(`${API_BASE_URL}api/register/`, data, config);
            // Handle the response from the backend as needed
            console.log(response.data);
            login(tempAuthData, { switchTo: !isAddAccount });  // defer login
            handleNext();                    // go to role selection/setup
        } catch (error) {
            // Handle registration error
            console.error('Registration failed:', error);
            setRegisterError((error.response.data && error.response.data.message) || (error.message));
        }
    };

    const handleSubmitOrg = async (e) => {
        e.preventDefault();
        const { orgName, orgSlug, orgDomain, orgType, requireDomainEmail } = formData;
        const data = {
            name: orgName,
            slug: orgSlug,
            domain: orgDomain,
            type: orgType,
            require_domain_email: requireDomainEmail
        };

        try {
            const response = await callApi('register/organization/', 'POST', data, 'application/json', tempAuthData);
            console.log(response.data);
            // Handle successful organization creation here
            login(tempAuthData);
        } catch (error) {
            console.error('Error creating organization:', error);
        }
    };

    const handleJoinWithInvite = async (e) => {
        e.preventDefault();
        const { inviteCode } = formData;
        try {
            const response = await callApi(`organization/join/${inviteCode}/`, 'POST', null, 'application/json', tempAuthData);
            console.log(response.data);
            // Handle successful join here
        } catch (error) {
            console.error('Error joining organization:', error);
        }
    };

    const handleRequestJoinOrg = async (e) => {
        e.preventDefault();
        const { searchOrg } = formData;
        try {
            const response = await callApi(`organization/request/${searchOrg}/`, 'POST', 'application/json', tempAuthData);
            console.log(response.data);
            // Handle successful join request here
        } catch (error) {
            console.error('Error requesting to join organization:', error);
        }
    }

    return (
        <div className='org-register-container-inner'>
            <div className="org-register-container">
                <h2>Create Organizational Account</h2>
                {step === 1 && (
                    <div className="org-step">
                        <h3>Select Your Role</h3>
                        <ul className="org-role-list">
                            {roles.map((role, index) => (
                                <li key={role}>
                                    <label key={index} className="control-settings-item">
                                        {role}
                                        <input
                                            type="radio"
                                            name="selectedRole"
                                            value={role.toLowerCase()}
                                            checked={formData.selectedRole === role.toLowerCase()}
                                            onChange={handleInputChange}
                                            className="custom-checkbox"
                                            />
                                        <span className="custom-checkmark"></span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                        <div className="org-step-actions">
                        <p className='register-card-organization'>
                            Not an organizational account? <Link to="/register">Register here</Link>
                        </p>
                            <button disabled={!formData.selectedRole} onClick={handleNext}>Next</button>
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <form onSubmit={handleRegisterSubmit}>
                        <div className='register-card-full-name'>
                            <input type="text" id="firstName" name='firstName' placeholder="First Name" required
                                onChange={handleInputChange} />

                            <input type="text" id="lastName" name="lastName" placeholder="Last Name" required
                                onChange={handleInputChange} />
                        </div>
                        <div className='register-card-other-fields'>
                            <input type="text" id="username" name="username" placeholder="Username" required
                                onChange={handleInputChange} />

                            <input type="email" id="email" name="email" placeholder="Email" required
                                onChange={handleInputChange} />


                            <div className='register-password-field-container'>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password" name="password" placeholder="Password" required
                                    onChange={handleInputChange} />
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
                        </div>
                        <div className='redirect-to-login'>
                            <Link to="/login">Already have an account? Login</Link>
                        </div>
                        <div className="org-step-actions">
                            <button type="button" onClick={handleBack}>Back</button>
                            <button type="submit">Continue</button>
                        </div>
                        {registerError && <p className="error-message">{registerError}</p>}

                    </form>
                )}

                {step === 3 && formData.selectedRole === 'admin' && (
                    <div className="org-step">
                        <h3>Organization Details</h3>
                        <div className='form-field'>
                            <input type="text" name="orgName" placeholder=" " required onChange={handleInputChange} />
                            <label htmlFor="orgName">Organization Name</label>
                        </div>
                        <div className='form-field'>
                            <input type="text" name="orgSlug" placeholder=" " required onChange={handleInputChange} />
                            <label htmlFor="orgSlug">Organization Handle</label>
                        </div>
                        <div className='form-field'>
                            <input type="text" name="orgDomain" placeholder=" " onChange={handleInputChange} />
                            <label htmlFor="orgDomain">Custom Domain (optional)</label>
                        </div>
                        <div className='org-type-select-field'>
                            <div className='form-field'>
                                <select name="orgType" required onChange={handleInputChange}>
                                    <option disabled value="">Select Organization Type</option>
                                    <option value="school">School</option>
                                    <option value="university">University</option>
                                    <option value="startup">Startup</option>
                                    <option value="research">Research Lab</option>
                                    <option value="company">Company</option>
                                    <option value="company">Other</option>
                                </select>
                                <label htmlFor="orgType">Organization Type</label>
                            </div>
                        </div>

                        <label className="control-settings-item">
                            <p>Require memebers to register with your domain?</p>
                            <input
                                type="checkbox"
                                name="requireDomainEmail"
                                onChange={(e) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        requireDomainEmail: e.target.checked
                                    }))
                                }
                                className="custom-checkbox"
                            />
                            <span className="custom-checkmark"></span>
                        </label>

                        <div className="org-step-actions">
                            <button onClick={handleBack}>Back</button>
                            <button onClick={handleSubmitOrg}>Create Organization</button>
                        </div>
                    </div>
                )}

                {step === 3 && formData.selectedRole === 'member' && (
                    <div className="org-step">
                        <h3>Join an Organization</h3>
                        <div>
                            <label>Have an invite code?</label>
                            <input type="text" name="inviteCode" placeholder="Enter Invite Code" onChange={handleInputChange} />
                            <button onClick={handleJoinWithInvite}>Join with Code</button>
                        </div>
                        <div>
                            <label>Or search and request to join:</label>
                            <input type="text" name="searchOrg" placeholder="Search Organization..." onChange={handleInputChange} />
                            {/* Suggest a dropdown result or implement search results here */}
                            <button onClick={handleRequestJoinOrg}>Request Access</button>
                        </div>

                        <div className="org-step-actions">
                            <button onClick={handleBack}>Back</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default OrganizationalRegister;
