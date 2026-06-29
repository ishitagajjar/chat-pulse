import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

export function socketAuth(
  socket: Socket,
  next: (err?: ExtendedError) => void
): void {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    next(new Error("Authentication required"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    socket.data.userId = payload.userId;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}
