// useApi.js
import getConfig from './config';
import { useAuth } from '../hooks/useAuth';
import apiCall from './api';

const useApi = () => {
    const { authState } = useAuth();
    
    const callApi = (endpoint, method = 'GET', data = null, contentType = 'application/json', tempAuthState = null, customConfig = {}) => {
        console.log('inside callApi')
        return apiCall(
            endpoint,
            method,
            data,
            contentType,
            tempAuthState ? tempAuthState : authState,
            customConfig
        );
    };

    return { callApi };
};

export default useApi;