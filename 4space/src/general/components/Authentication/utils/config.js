const GetConfig = (token) => {
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`
    }

    return {
        headers: headers
    }
};

export default GetConfig;
