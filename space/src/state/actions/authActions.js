// authActions.js
import { authActionTypes } from '../reducers/authReducer';

// Login Action
export const loginAction = (user, token) => ({
  type: authActionTypes.LOGIN,
  payload: { user, isAuthenticated: true, token },
});

// Logout Action
export const logoutAction = () => ({
  type: authActionTypes.LOGOUT,
});
