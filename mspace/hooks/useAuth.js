import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginAction,
  logoutAction,
  switchAccountAction,
  addAccountAction,
} from '../state/actions/authActions';

const AUTH_KEY = 'authAccounts';
const CURRENT_KEY = 'authCurrent';

const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(authState.current?.token);

  // Load session data from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedAccounts = JSON.parse(await AsyncStorage.getItem(AUTH_KEY)) || [];
        const storedCurrent = JSON.parse(await AsyncStorage.getItem(CURRENT_KEY));

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
    })();
  }, [dispatch]);

  // Login or add account
  const login = async (responseData, { switchTo = true } = {}) => {
    const { user, token } = responseData;

    dispatch(addAccountAction(user, token));
    dispatch(switchAccountAction(user, token));
    await AsyncStorage.setItem(CURRENT_KEY, JSON.stringify({ user, token }));

    // Merge and deduplicate global account list
    const existingAccounts = JSON.parse(await AsyncStorage.getItem(AUTH_KEY)) || [];
    const updatedAccounts = [
      ...existingAccounts.filter((acc) => acc.user.username !== user.username),
      { user, token },
    ];
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updatedAccounts));
  };

  // Switch active account
  const switchProfile = async (account) => {
    dispatch(switchAccountAction(account.user, account.token));
    await AsyncStorage.setItem(CURRENT_KEY, JSON.stringify(account));
    // Optionally, navigate to home tab if needed
  };

  // Logout
  const logout = async () => {
    dispatch(logoutAction());
    await AsyncStorage.removeItem(AUTH_KEY);
    await AsyncStorage.removeItem(CURRENT_KEY);
    // Optionally, navigate to login screen here
  };

  return {
    authState,
    isAuthenticated,
    isLoading,
    login,
    logout,
    switchProfile,
  };
};

export { useAuth };
