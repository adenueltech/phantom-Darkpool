import { useEffect, useState } from 'react';
import { wsClient, WebSocketEvent } from '@/lib/websocket-client';

export function useWebSocket(callback?: (event: WebSocketEvent) => void) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = wsClient.subscribe((event) => {
      if (callback) {
        callback(event);
      }
    });

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(wsClient.isConnected());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(checkConnection);
    };
  }, [callback]);

  return { isConnected };
}
