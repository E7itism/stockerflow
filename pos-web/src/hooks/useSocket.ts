import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * useSocket — connects to the Socket.io server and listens for events.
 * Ties socket lifecycle to the React component — auto-cleans on unmount.
 */
export const useSocket = (events: Record<string, (data: any) => void>) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    Object.entries(events).forEach(([event, handler]) => {
      socketRef.current?.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socketRef.current?.off(event, handler);
      });
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef.current;
};
