// src/pages/Auth/OauthCallback.js
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const OauthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const user = {
      id: params.get('id'),
      username: params.get('username'),
      email: params.get('email'),
      first_name: params.get('first_name'),
      last_name: params.get('last_name'),
      role: params.get('role'),
      profile_image: params.get('profile_image'),
    };

    if (token) {
      login({ token, user });
      navigate('/timeline');
    } else {
      navigate('/login');
    }
  }, []);

  return <div>Logging in with GitHub...</div>;
};

export default OauthCallback;
