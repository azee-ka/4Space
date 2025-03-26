// useAuth.js
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginAction, logoutAction } from '../state/actions/authActions';  // Importing the action creators

const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAuthStateString = localStorage.getItem('authState');

    try {
      const storedAuthState = JSON.parse(storedAuthStateString);

      if (storedAuthState && storedAuthState.token) {
        // Dispatch the login action from authActions
        dispatch(loginAction(storedAuthState.user, storedAuthState.token));
      }
    } catch (error) {
      console.error('Error parsing stored auth state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const login = (responseData) => {
    const { user, token, message } = responseData;

    // Dispatch login action from authActions
    dispatch(loginAction(user, token));

    // Save authentication state to localStorage
    localStorage.setItem('authState', JSON.stringify({ user, token }));
  };

  const switchProfile = (responseData) => {
    logout();  // Log out the current user
    login(responseData);  // Log in with new credentials
    window.location.href = '/';
  };

  const logout = () => {
    // Dispatch logout action from authActions
    dispatch(logoutAction());

    // Clear authentication state from localStorage
    localStorage.removeItem('authState');
    window.location.href = '/access/login';  // Redirect to login page
  };

  return { authState, isLoading, login, logout, switchProfile };
};

export { useAuth };
