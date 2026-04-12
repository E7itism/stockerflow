import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * useSocket — connects to the Socket.io server and listens for events.
 *
 * WHY a hook instead of a global socket instance?
 * The hook ties the socket lifecycle to the React component.
 * When the component unmounts, the listener is removed automatically.
 * A global instance would accumulate stale listeners over time.
 *
 * WHY useRef for the socket?
 * We don't want to reconnect every time the component re-renders.
 * useRef persists the socket across renders without triggering re-renders itself.
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
  }, [events]); // include events if they can change

  return socketRef;
};
