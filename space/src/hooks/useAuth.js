import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginAction,
  logoutAction,
  switchAccountAction,
  addAccountAction,
} from '../state/actions/authActions';

const AUTH_KEY = 'authAccounts'; // Shared list
const CURRENT_KEY = 'authCurrent'; // Current session

const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  const isAddAccountMode = new URLSearchParams(window.location.search).get('from') === 'add-account';
  const isAuthenticated = Boolean(authState.current?.token);
  const isAddingAccount = isAddAccountMode;

  // 🔄 Load session data
  useEffect(() => {
    if (isAddAccountMode) {
      setIsLoading(false); // Skip hydrating in add account mode
      return;
    }

    try {
      const storedAccounts = JSON.parse(localStorage.getItem(AUTH_KEY)) || [];
      const storedCurrent = JSON.parse(sessionStorage.getItem(CURRENT_KEY));

      storedAccounts.forEach((acc) => {
        dispatch(addAccountAction(acc.user, acc.token));
      });

      if (storedCurrent?.token) {
        dispatch(switchAccountAction(storedCurrent.user, storedCurrent.token));
      }
    } catch (err) {
      console.warn('Failed to restore session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, isAddAccountMode]);

  // ✅ Login or add account
  const login = (responseData, { switchTo = true } = {}) => {
  const { user, token } = responseData;

  dispatch(addAccountAction(user, token));

  // Always set current in sessionStorage for this tab
  dispatch(switchAccountAction(user, token));
  sessionStorage.setItem(CURRENT_KEY, JSON.stringify({ user, token }));

  // Merge and deduplicate global account list
  const existingAccounts = JSON.parse(localStorage.getItem(AUTH_KEY)) || [];
  const updatedAccounts = [
    ...existingAccounts.filter((acc) => acc.user.username !== user.username),
    { user, token },
  ];
  localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAccounts));
};


  // 🔁 Switch active account
  const switchProfile = (account) => {
    dispatch(switchAccountAction(account.user, account.token));
    sessionStorage.setItem(CURRENT_KEY, JSON.stringify(account));
    window.location.href = '/';
  };

  // 🚪 Logout (clears all)
  const logout = () => {
    dispatch(logoutAction());
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(CURRENT_KEY);
    window.location.href = '/login';
  };

  return {
    authState,
    isAuthenticated,
    isAddingAccount,
    isLoading,
    login,
    logout,
    switchProfile,
  };
};

export { useAuth };
