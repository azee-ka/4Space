import axios from 'axios';
import API_BASE_URL from './apiUrl';
import getConfig from '../config';
// General API call function
const apiCall = async (endpoint, method = 'GET', data = null, contentType, authState) => {
    const config = getConfig(authState?.token, contentType);

    try {
        const response = await axios({
            method,
            url: `${API_BASE_URL}api/${endpoint}`,
            data: data,
            headers: config.headers || {},
            params: config.params || {},
        });
        return response;  // returning data directly
    } catch (error) {
        // console.error(`Error calling ${endpoint}:`, error);
        throw error;
    }
};

export default apiCall;
