// config.js
function getConfig(token, method = 'GET', contentType = 'application/json') {
    const headers = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    // Only set Content-Type for methods with a body
    if (!['GET', 'HEAD'].includes(method.toUpperCase()) && contentType) {
        headers['Content-Type'] = contentType;
    }
    return { headers };
}

export default getConfig;
