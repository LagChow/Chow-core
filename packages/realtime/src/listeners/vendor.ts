import { Socket } from "socket.io-client";
import { RealtimeEvents } from "../events";
import { SocketPayload } from "../payloads";

export const listenToVendorEvent = <T>(
  socket: Socket,
  event: keyof typeof RealtimeEvents,
  callback: (payload: SocketPayload<T>) => void
) => {
  socket.on(event, callback);
  return () => {
    socket.off(event, callback);
  };
};
