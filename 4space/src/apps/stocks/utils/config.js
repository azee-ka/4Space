const stockConfig = {
    websocketUrl: `wss://ws.finnhub.io?token=${process.env.REACT_APP_WEBSOCKET_TOKEN}`,
    baseUrl: 'https://finnhub.io/api/v1',
};

export default stockConfig;
