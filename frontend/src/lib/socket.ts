import { io, Socket } from "socket.io-client";

export type ChatSocket = Socket;

export function createSocket(token: string): ChatSocket {
  const url = import.meta.env.VITE_WS_URL || "http://localhost:3000";

  return io(url, {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
}
