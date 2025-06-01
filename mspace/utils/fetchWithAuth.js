// utils/fetchWithAuth.js
import API_BASE_URL from './apiUrl';

export default async function fetchWithAuth(
  url,
  { method = 'GET', data = null, authState = null, extraHeaders = {} } = {}
) {
  const headers = { ...extraHeaders };

  // Add token if available
  if (authState?.current?.token) {
    headers['Authorization'] = `Token ${authState.current.token}`;
  }

  // Only set Content-Type for non-GET with a body
  if (data && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const options = { method, headers };
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(API_BASE_URL + 'api/' + url, options);

  if (!response.ok) {
    // Try to parse error details if present
    let errorText;
    try {
      errorText = await response.text();
    } catch { errorText = 'Unknown error'; }
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}
