import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "@lagchow/config";

let socketInstance: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socketInstance) {
    let wsUrl = "http://localhost:3010"; // Default
    if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WS_URL) {
      wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    } else if (typeof process !== "undefined" && process.env.EXPO_PUBLIC_WS_URL) {
      wsUrl = process.env.EXPO_PUBLIC_WS_URL;
    }

    socketInstance = io(wsUrl, {
      autoConnect: false, // Don't connect until we have a valid token
      reconnection: true,
      withCredentials: true,
      ...(token && { auth: { token } }),
    });
  } else if (token) {
    // Update the token on an existing instance (will be applied on next connect/reconnect)
    socketInstance.auth = { token };
  }
  return socketInstance;
};
