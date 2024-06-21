import { useEffect, useRef } from 'react';

const usePersistentWebSocket = (url, config, onMessage) => {
    const websocket = useRef(null);

    useEffect(() => {
        if (url && !websocket.current) {
            console.log('Initializing WebSocket connection...');
            websocket.current = new WebSocket(url, [], config);

            websocket.current.onopen = () => {
                console.log('WebSocket connection established');
            };

            websocket.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data);
                onMessage(data);
            };

            websocket.current.onclose = () => {
                console.log('WebSocket closed');
                websocket.current = null;
            };

            websocket.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            return () => {
                if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
                    websocket.current.close();
                }
            };
        }
    }, [url, onMessage]);

    return websocket.current;
};

export default usePersistentWebSocket;
