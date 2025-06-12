import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import API_BASE_URL from '../../../utils/apiUrl';

const GoogleCustomButton = () => {
    const buttonDiv = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const isAddAccount = new URLSearchParams(location.search).get('from') === 'add-account';

    const handleCredentialResponse = async (response) => {
        try {
            const res = await axios.post(`${API_BASE_URL}api/auth/google/`, {
                token: response.credential,
            });
            login(res.data, { switchTo: !isAddAccount });
            navigate('/timeline');
        } catch (err) {
            console.error('Google sign-in failed:', err);
        }
    };

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                    use_fedcm_for_prompt: true, // ✔️ Use FedCM where supported
                    use_fedcm_for_button: true, // ✔️ Use FedCM button style if available
                });


                window.google.accounts.id.renderButton(buttonDiv.current, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    shape: 'pill',
                    text: 'continue_with',
                    logo_alignment: 'left',
                });
            }
        };
    }, []);

    return <div ref={buttonDiv}></div>;
};

export default GoogleCustomButton;