import getConfig from '../config';
import { useAuth } from '../hooks/useAuth';
import apiCall from './api';

const useApi = () => {
    const { authState } = useAuth();
    
    const callApi = (endpoint, method = 'GET', data = null, contentType = 'application/json') => {
        return apiCall(
            endpoint,
            method,
            data,
            contentType,
            authState,
        );
    };

    return { callApi }; // Return the wrapped API function
};

export default useApi;
