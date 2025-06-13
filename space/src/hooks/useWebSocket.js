import { useEffect, useRef, useCallback, useState } from "react";
import { WS_BASE_URL } from "../utils/apiUrl";

const useWebSocket = (url, options = {}) => {
    const { onMessage, onOpen, onClose, onError, dependencies = [] } = options;
    const socketRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const socket = new WebSocket(`${WS_BASE_URL}ws/${url}`);
        socketRef.current = socket;
        setIsReady(false);

        socket.onopen = () => {
            console.log('WebSocket connected');
            setIsReady(true);
            if (onOpen) onOpen();
        };

        socket.onmessage = (event) => {
            if (onMessage) onMessage(JSON.parse(event.data));
        };

        socket.onclose = (event) => {
            console.log('WebSocket closed:', event);
            setIsReady(false);
            if (onClose) onClose(event);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsReady(false);
            if (onError) onError(error);
        };

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

    return { sendMessage, isReady };
};

export default useWebSocket;
