import { Server, Socket } from "socket.io";
import { registerChatHandlers } from "./handlers/chat.handler";
import { registerTypingHandlers } from "./handlers/typing.handler";
import { registerPresenceHandlers } from "./handlers/presence.handler";
import { registerReactionHandlers } from "./handlers/reaction.handler";

export function registerSocketHandlers(io: Server, socket: Socket): void {
  registerChatHandlers(io, socket);
  registerTypingHandlers(socket);
  registerPresenceHandlers(socket);
  registerReactionHandlers(io, socket);
}
