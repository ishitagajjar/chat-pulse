import { Server } from "socket.io";
import { socketAuth } from "./middlewares/socketAuth";
import { presenceService } from "./services/presence.service";
import { registerSocketHandlers } from "./socket/index";
import { prisma } from "./lib/prisma";

export function initializeSocket(io: Server): void {
  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const userId = socket.data.userId as string;
    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    await presenceService.setOnline(userId, socket.id);
    socket.join(`user:${userId}`);

    const workspaceIds = await presenceService.getUserWorkspaceIds(userId);

    // Send connecting user a snapshot of who is already online
    const onlineUserIds = new Set<string>();
    for (const workspaceId of workspaceIds) {
      const online = await presenceService.getWorkspaceOnlineUsers(workspaceId);
      for (const id of online) {
        onlineUserIds.add(id);
      }
    }
    for (const onlineUserId of onlineUserIds) {
      socket.emit("presence:update", {
        userId: onlineUserId,
        status: "online",
      });
    }

    // Notify workspace members that this user came online
    for (const workspaceId of workspaceIds) {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        select: { userId: true },
      });
      for (const member of members) {
        if (member.userId !== userId) {
          io.to(`user:${member.userId}`).emit("presence:update", {
            userId,
            status: "online",
          });
        }
      }
    }

    registerSocketHandlers(io, socket);

    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      await presenceService.setOffline(userId, socket.id);

      for (const workspaceId of workspaceIds) {
        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId },
          select: { userId: true },
        });
        for (const member of members) {
          if (member.userId !== userId) {
            io.to(`user:${member.userId}`).emit("presence:update", {
              userId,
              status: "offline",
            });
          }
        }
      }
    });
  });
}
