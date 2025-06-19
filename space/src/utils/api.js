// apiCall.js
import axios from 'axios';
import API_BASE_URL from './apiUrl';
import getConfig from '../config';

const apiCall = async (endpoint, method = 'GET', data = null, contentType, customConfig = {}) => {
    const config = getConfig(contentType);

    try {
        const response = await axios({
            method,
            url: `${API_BASE_URL}api/${endpoint}`,
            data,
            headers: config.headers || {},
            params: config.params || {},
            ...customConfig
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export default apiCall;
