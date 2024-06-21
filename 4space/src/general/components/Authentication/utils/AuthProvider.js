// AuthProvider.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { initialState, actionTypes } from './authReducer';
import API_BASE_URL from './apiConfig';
import axios from 'axios';

const AuthStateContext = createContext();
const AuthDispatchContext = createContext();

const authReducer = (state, action) => {
    switch (action.type) {
        case actionTypes.LOGIN_SUCCESS:
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                token: action.payload.token,
            };
        case actionTypes.LOGOUT:
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                token: null,
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const storedAuthData = JSON.parse(localStorage.getItem('authData'));
    const [state, dispatch] = useReducer(authReducer, storedAuthData || initialState);

    const login = async (username, password) => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        }
        const data = {
            username,
            password,
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/user/login/`, data, config);
            console.log(response.data)
            const { token, user } = response.data;
            dispatch({ type: actionTypes.LOGIN_SUCCESS, payload: { user, token } });
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    const logout = () => {
        dispatch({ type: actionTypes.LOGOUT });
    };

    useEffect(() => {
        localStorage.setItem('authData', JSON.stringify(state));
    }, [state]);

    return (
        <AuthStateContext.Provider value={state}>
            <AuthDispatchContext.Provider value={{ isAuthenticated: state.isAuthenticated, login, logout }}>
                {children}
            </AuthDispatchContext.Provider>
        </AuthStateContext.Provider>
    );
};


export const useAuthState = () => {
    const context = useContext(AuthStateContext);
    if (context === undefined) {
        throw new Error('useAuthState must be used within an AuthProvider');
    }
    return context;
};

export const useAuthDispatch = () => {
    const context = useContext(AuthDispatchContext);
    if (context === undefined) {
        throw new Error('useAuthDispatch must be used within an AuthProvider');
    }
    return context;
};
