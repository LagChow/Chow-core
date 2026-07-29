import { Socket } from "socket.io-client";
import { RealtimeEvents } from "../events";
import { SocketPayload } from "../payloads";

export const emitTrekkerEvent = <T>(
  socket: Socket,
  event: keyof typeof RealtimeEvents,
  payload: SocketPayload<T>
) => {
  socket.emit(event, payload);
};
