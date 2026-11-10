import { useEffect, useRef } from 'react';

/**
 * @param {{
 *   userId?: number,
 *   token?: string,
 *   onMessageNew?: (payload: object) => void,
 *   onMessagesRead?: (payload: object) => void,
 *   onConnectionChange?: (connected: boolean) => void,
 * }} options
 */
export function useChatWebSocket({
    userId,
    token,
    onMessageNew,
    onMessagesRead,
    onConnectionChange,
}) {
    const onMessageRef = useRef(onMessageNew);
    const onReadRef = useRef(onMessagesRead);
    const onConnectionRef = useRef(onConnectionChange);

    useEffect(() => {
        onMessageRef.current = onMessageNew;
    }, [onMessageNew]);

    useEffect(() => {
        onReadRef.current = onMessagesRead;
    }, [onMessagesRead]);

    useEffect(() => {
        onConnectionRef.current = onConnectionChange;
    }, [onConnectionChange]);

    useEffect(() => {
        if (!userId || !token) return undefined;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/chat/ws?token=${encodeURIComponent(token)}`;

        let stopped = false;
        let reconnectTimer = null;
        let ws = null;

        const connect = () => {
            if (stopped) return;
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                onConnectionRef.current?.(true);
            };

            ws.onmessage = (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                } catch {
                    return;
                }
                if (data?.type === 'message.new') {
                    onMessageRef.current?.(data);
                } else if (data?.type === 'messages.read') {
                    onReadRef.current?.(data);
                }
            };

            ws.onclose = () => {
                onConnectionRef.current?.(false);
                ws = null;
                if (!stopped) {
                    reconnectTimer = setTimeout(connect, 3000);
                }
            };

            ws.onerror = () => {
                ws?.close();
            };
        };

        connect();

        return () => {
            stopped = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (ws) {
                ws.onclose = null;
                ws.close();
            }
            onConnectionRef.current?.(false);
        };
    }, [userId, token]);
}
