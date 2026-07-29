import { useEffect } from "react";
import { useSocket } from "../useSocket";
import { RealtimeEvents } from "../events";
import { SocketPayload } from "../payloads";

export const useTrekkerSocket = <T>(
  event: keyof typeof RealtimeEvents,
  callback: (payload: SocketPayload<T>) => void
) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, isConnected, event, callback]);
};
