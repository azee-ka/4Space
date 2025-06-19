// config.js (or wherever getConfig lives)
function getConfig(contentType = 'application/json') {
    // Read the current user session from sessionStorage
    const current = JSON.parse(sessionStorage.getItem('authCurrent') || '{}');
    const token = current.token;

    const headers = {
        'Content-Type': contentType
    };
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    return { headers };
}

export default getConfig;
