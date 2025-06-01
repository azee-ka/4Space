// authActions.js
import { authActionTypes } from '../reducers/authReducer';

export const loginAction = (user, token) => ({
  type: authActionTypes.LOGIN,
  payload: { user, token, username: user.username },
});

export const addAccountAction = (user, token) => ({
  type: authActionTypes.ADD,
  payload: { user, token, username: user.username },
});

export const switchAccountAction = (user, token) => ({
  type: authActionTypes.SWITCH,
  payload: { user, token },
});

export const logoutAction = () => ({
  type: authActionTypes.LOGOUT,
});
