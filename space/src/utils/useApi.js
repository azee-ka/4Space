import getConfig from '../config';
import { useAuth } from '../hooks/useAuth';
import apiCall from './api';

const useApi = () => {
    const { authState } = useAuth();
    
    const callApi = (endpoint, method = 'GET', data = null, contentType = 'application/json', tempAuthState = null) => {
        return apiCall(
            endpoint,
            method,
            data,
            contentType,
            tempAuthState ? tempAuthState : authState,
        );
    };

    return { callApi }; // Return the wrapped API function
};

export default useApi;
