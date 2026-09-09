import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { addNotification } from '../store/slices/notificationSlice';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { accessToken, user } = useSelector((state) => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!accessToken || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Determine socket endpoint (default port 5000)
    const backendUrl =
      import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
        : 'http://localhost:5000';

    const socket = io(backendUrl, {
      auth: { token: accessToken },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setReconnecting(false);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Disconnected by server, manual reconnect needed
        socket.connect();
      } else {
        setReconnecting(true);
      }
    });

    socket.on('connect_error', () => {
      setReconnecting(true);
    });

    // Real-time Notification Engine Ingestion
    socket.on('notification:new', (notification) => {
      dispatch(addNotification(notification));
    });

    // Clean up on unmount or token change
    return () => {
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [accessToken, user, dispatch]);

  const value = {
    socket: socketRef.current,
    isConnected,
    reconnecting,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
