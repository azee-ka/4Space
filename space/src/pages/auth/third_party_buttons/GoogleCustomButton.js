import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import API_BASE_URL from '../../../utils/apiUrl';
import './google-button.css';

const GoogleCustomButton = () => {
    const buttonDiv = useRef(null);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const isAddAccount = new URLSearchParams(location.search).get('from') === 'add-account';

    const [containerWidth, setContainerWidth] = useState(300);

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
        // Load the script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (wrapperRef.current) {
                setContainerWidth(wrapperRef.current.offsetWidth);
            }

            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                    use_fedcm_for_prompt: true,
                });

                window.google.accounts.id.renderButton(buttonDiv.current, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    shape: 'pill',
                    text: 'continue_with',
                    logo_alignment: 'left',
                    width: containerWidth,
                });
            }
        };

        return () => {
            // Optional cleanup
            if (script) document.body.removeChild(script);
        };
    }, [containerWidth]);


    useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
        setContainerWidth(entry.contentRect.width);
    });

    if (wrapperRef.current) {
        observer.observe(wrapperRef.current);
    }

    return () => observer.disconnect();
}, []);

    return (
        <div ref={wrapperRef} className="oauth-btn-wrapper-inner">
            <div ref={buttonDiv}></div>
        </div>
    );
};

export default GoogleCustomButton;
