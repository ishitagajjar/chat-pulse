import { Socket } from "socket.io";
import { z } from "zod";
import { getRedis, isRedisConnected, memoryStore } from "../../lib/redis";
import { prisma } from "../../lib/prisma";

const TYPING_TTL = 4;

const channelSchema = z.object({
  channelId: z.string().uuid(),
});

async function getTypingDisplayNames(
  channelId: string,
  userIds: string[]
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true },
  });
  return userIds
    .map((id) => users.find((u) => u.id === id)?.displayName)
    .filter((name): name is string => !!name);
}

async function emitTypingUpdate(
  socket: Socket,
  channelId: string,
  userIds: string[]
): Promise<void> {
  const names = await getTypingDisplayNames(channelId, userIds);
  // Broadcast to others in the room — sender should not see their own typing indicator
  socket.to(channelId).emit("typing:update", { channelId, users: names });
}

export function registerTypingHandlers(socket: Socket): void {
  const userId = socket.data.userId as string;

  socket.on("typing:start", async (data) => {
    try {
      const { channelId } = channelSchema.parse(data);
      const redis = getRedis();

      if (redis && isRedisConnected()) {
        const key = `typing:${channelId}`;
        await redis.sadd(key, userId);
        await redis.expire(key, TYPING_TTL);
        const members = await redis.smembers(key);
        await emitTypingUpdate(socket, channelId, members);
      } else {
        memoryStore.addTyping(channelId, userId, TYPING_TTL);
        const members = memoryStore.getTypingUsers(channelId);
        await emitTypingUpdate(socket, channelId, members);
      }
    } catch (err) {
      console.error("typing:start error:", err);
    }
  });

  socket.on("typing:stop", async (data) => {
    try {
      const { channelId } = channelSchema.parse(data);
      const redis = getRedis();

      if (redis && isRedisConnected()) {
        const key = `typing:${channelId}`;
        await redis.srem(key, userId);
        const members = await redis.smembers(key);
        await emitTypingUpdate(socket, channelId, members);
      } else {
        memoryStore.removeTyping(channelId, userId);
        const members = memoryStore.getTypingUsers(channelId);
        await emitTypingUpdate(socket, channelId, members);
      }
    } catch (err) {
      console.error("typing:stop error:", err);
    }
  });
}
