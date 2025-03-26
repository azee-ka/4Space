function getConfig(token, contentType) {
    const config = {
        headers: {
            'Content-Type': contentType,
            Authorization: `Token ${token}`
        }
    };
    return config;
}

export default getConfig;