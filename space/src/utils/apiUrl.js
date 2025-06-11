// utils/config/config.js

const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_BASE_URL
    : 'http://localhost:8000/'; // fallback for local dev

export const CLIENT_BASE_URL =
  process.env.REACT_APP_CLIENT_BASE_URL || 'http://localhost:3000';

export const WS_BASE_URL =
  process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8000';

export default API_BASE_URL;
