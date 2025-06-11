// src/pages/Auth/OauthCallback.js
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const OauthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        const token = new URLSearchParams(location.search).get('token');
        if (token) {
            login({ token });
            navigate('/timeline');
        } else {
            navigate('/login');
        }
    }, []);

    return <div>Logging in with GitHub...</div>;
};

export default OauthCallback;
