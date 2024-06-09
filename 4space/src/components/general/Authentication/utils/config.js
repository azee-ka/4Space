const GetConfig = (token) => {
    return {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
        }
    };
};

export default GetConfig;
