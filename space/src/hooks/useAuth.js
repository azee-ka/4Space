import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginAction,
  logoutAction,
  switchAccountAction,
  addAccountAction,
} from '../state/actions/authActions';
import useTabSessionSync from './useTabSessionSync';  // adjust path if needed

const AUTH_KEY = 'authAccounts';     // persistent all logged-in accounts
const CURRENT_KEY = 'authCurrent';   // current session for this tab only

const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  const { checkAndApplySessionSwitch } = useTabSessionSync();

  const isAddAccountMode = new URLSearchParams(window.location.search).get('from') === 'add-account';
  const isAuthenticated = Boolean(authState.current?.token);
  const isAddingAccount = isAddAccountMode;

  // Ref to avoid repeated session switch logic causing infinite loops
  const sessionSwitchAppliedRef = useRef(false);

  useEffect(() => {
    if (isAddAccountMode) {
      setIsLoading(false);
      return;
    }

    // Check for session switch payload only once
    checkAndApplySessionSwitch((account) => {
      if (!sessionSwitchAppliedRef.current) {
        sessionSwitchAppliedRef.current = true;

        dispatch(addAccountAction(account.user, account.token));
        dispatch(switchAccountAction(account.user, account.token));
        sessionStorage.setItem(CURRENT_KEY, JSON.stringify(account));
        setIsLoading(false);
      }
    });

    if (sessionSwitchAppliedRef.current) {
      // Session switch already applied, skip rest
      return;
    }

    // Normal restore flow
    try {
      const storedAccounts = JSON.parse(localStorage.getItem(AUTH_KEY)) || [];
      let storedCurrent = JSON.parse(sessionStorage.getItem(CURRENT_KEY));

      // If no current session for this tab, fallback to last logged in account from localStorage
      if (!storedCurrent && storedAccounts.length > 0) {
        storedCurrent = storedAccounts[storedAccounts.length - 1];
        sessionStorage.setItem(CURRENT_KEY, JSON.stringify(storedCurrent));
      }

      // Restore all accounts in Redux
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

  // Login or add account, with optional immediate switch
  const login = (responseData, { switchTo = true } = {}) => {
    const { user, token } = responseData;

    dispatch(addAccountAction(user, token));

    const existingAccounts = JSON.parse(localStorage.getItem(AUTH_KEY)) || [];
    const updatedAccounts = [
      ...existingAccounts.filter((acc) => acc.user.username !== user.username),
      { user, token },
    ];
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAccounts));

    if (switchTo) {
      dispatch(switchAccountAction(user, token));
      sessionStorage.setItem(CURRENT_KEY, JSON.stringify({ user, token }));
    }
  };

  // Switch profile in same tab only
  const switchProfile = (account) => {
    dispatch(switchAccountAction(account.user, account.token));
    sessionStorage.setItem(CURRENT_KEY, JSON.stringify(account));
    // Reload to apply auth context fully (optional)
    window.location.href = '/';
  };

  // Logout clears all auth state and storage
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
