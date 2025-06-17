import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginAction,
  logoutAction,
  switchAccountAction,
  addAccountAction,
} from '../state/actions/authActions';
import useTabSessionSync from './useTabSessionSync';  // adjust path if needed

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}


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
  let { user, token } = responseData;

  // If only token is provided (e.g., GitHub redirect), fetch user info
  if (!user && token) {
    try {
      const payload = parseJwt(token); // extract user info from token (if it's a JWT)
      user = { username: payload?.username || 'unknown' }; // fallback
    } catch {
      user = { username: 'unknown' };
    }
  }

  if (!user || !token) return;

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

    // Google: disable auto-select to prevent re-sign-in loop
    if (window.google && window.google.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

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