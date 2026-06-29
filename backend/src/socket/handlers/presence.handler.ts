import { Socket } from "socket.io";
import { presenceService } from "../../services/presence.service";

export function registerPresenceHandlers(socket: Socket): void {
  socket.on("presence:heartbeat", async () => {
    const userId = socket.data.userId as string;
    await presenceService.refreshPresence(userId);
  });
}
