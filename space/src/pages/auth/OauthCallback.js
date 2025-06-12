// src/pages/Auth/OauthCallback.js
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import API_BASE_URL from '../../utils/apiUrl';

const OauthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        const code = new URLSearchParams(location.search).get('code');
        if (!code) {
            navigate('/login');
            return;
        }

        const exchangeCode = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}api/auth/github/callback/?code=${code}`);
                login(res.data, { switchTo: true }); // full token + user object
                navigate('/timeline');
            } catch (err) {
                console.error('GitHub OAuth failed:', err);
                navigate('/login');
            }
        };

        exchangeCode();
    }, []);

    return <div>Logging in with GitHub...</div>;
};

export default OauthCallback;
