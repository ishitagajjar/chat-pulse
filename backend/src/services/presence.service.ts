import { prisma } from "../lib/prisma";
import { getRedis, isRedisConnected, memoryStore } from "../lib/redis";

const PRESENCE_TTL = 60;

export const presenceService = {
  async setOnline(userId: string, socketId: string): Promise<void> {
    const redis = getRedis();
    if (redis && isRedisConnected()) {
      await redis.set(`presence:${userId}`, "online", "EX", PRESENCE_TTL);
      await redis.set(`socket:${socketId}`, userId, "EX", PRESENCE_TTL);
    } else {
      memoryStore.setPresence(userId, "online", PRESENCE_TTL);
      memoryStore.setSocketUser(socketId, userId);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: "ONLINE", lastSeenAt: new Date() },
    });
  },

  async setOffline(userId: string, socketId: string): Promise<void> {
    const redis = getRedis();
    if (redis && isRedisConnected()) {
      await redis.del(`presence:${userId}`);
      await redis.del(`socket:${socketId}`);
    } else {
      memoryStore.removePresence(userId);
      memoryStore.removeSocket(socketId);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: "OFFLINE", lastSeenAt: new Date() },
    });
  },

  async refreshPresence(userId: string): Promise<void> {
    const redis = getRedis();
    if (redis && isRedisConnected()) {
      await redis.expire(`presence:${userId}`, PRESENCE_TTL);
    } else {
      memoryStore.setPresence(userId, "online", PRESENCE_TTL);
    }
  },

  async getStatus(userId: string): Promise<string> {
    const redis = getRedis();
    if (redis && isRedisConnected()) {
      const status = await redis.get(`presence:${userId}`);
      return status ?? "offline";
    }
    return memoryStore.getPresence(userId) ?? "offline";
  },

  async getWorkspaceOnlineUsers(workspaceId: string): Promise<string[]> {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: { userId: true },
    });
    const memberIds = members.map((m) => m.userId);

    const online: string[] = [];
    const redis = getRedis();

    if (redis && isRedisConnected()) {
      for (const userId of memberIds) {
        const status = await redis.get(`presence:${userId}`);
        if (status === "online") online.push(userId);
      }
    } else {
      for (const userId of memberIds) {
        if (memoryStore.getPresence(userId)) online.push(userId);
      }
    }

    return online;
  },

  async getUserWorkspaceIds(userId: string): Promise<string[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    return memberships.map((m) => m.workspaceId);
  },
};
