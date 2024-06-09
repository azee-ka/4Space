// utils/config/config.js
const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://django-backend-url' : 'http://127.0.0.1:8000/';
export const CLIENT_BASE_URL = 'http://10.0.0.85:3000';

export default API_BASE_URL;
