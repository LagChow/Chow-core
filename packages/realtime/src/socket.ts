import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "@lagchow/config";

let socketInstance: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socketInstance) {
    // For WS, we typically replace http with ws, but socket.io handles http:// URLs fine.
    // Ensure we have the base URL. If API is at port 4000, maybe WS is at 3010.
    // The user's websocket server is on port 3010.
    let wsUrl = "http://localhost:3010"; // Default
    if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WS_URL) {
      wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    } else if (typeof process !== "undefined" && process.env.EXPO_PUBLIC_WS_URL) {
      wsUrl = process.env.EXPO_PUBLIC_WS_URL;
    }

    socketInstance = io(wsUrl, {
      autoConnect: true,
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
