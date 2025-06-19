// useApi.js
import apiCall from './api';

const useApi = () => {
    const callApi = (endpoint, method = 'GET', data = null, contentType = 'application/json', customConfig = {}) => {
        return apiCall(endpoint, method, data, contentType, customConfig);
    };

    return { callApi };
};

export default useApi;
