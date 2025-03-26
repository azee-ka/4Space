import { useEffect, useRef, useCallback } from "react";

const useWebSocket = (url, options = {}) => {
    const { onMessage, onOpen, onClose, onError, dependencies = [] } = options;
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${url}`);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connected');
            if (onOpen) onOpen();
        };

        socket.onmessage = (event) => {
            if (onMessage) onMessage(JSON.parse(event.data));
        };

        socket.onclose = (event) => {
            console.log('WebSocket closed:', event);
            if (onClose) onClose(event);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (onError) onError(error);
        };

        // return () => {
        //     if (socketRef.current) {
        //         socketRef.current.close();
        //     }
        // };
        return () => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.close();
            }
        };
    }, dependencies);

    const sendMessage = useCallback((message) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket connection not open.');
        }
    }, []);

    return { sendMessage };
};

export default useWebSocket;
