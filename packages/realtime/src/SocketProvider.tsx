"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "./socket";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode, token?: string }> = ({ children, token }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Don't connect if there's no token — the user isn't authenticated
    if (!token) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = getSocket(token);
    
    // Ensure the token is up to date and (re)connect
    s.auth = { token };
    if (!s.connected) {
      s.connect();
    } else if ((s.auth as any)?.token !== token) {
      // Token changed on an already-connected socket — reconnect with new token
      s.disconnect().connect();
    }

    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
