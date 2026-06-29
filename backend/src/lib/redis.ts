import Redis from "ioredis";
import { config } from "../config";

let redis: Redis | null = null;
let fallbackLogged = false;

function logFallback(message: string): void {
  if (!fallbackLogged) {
    console.warn(message);
    fallbackLogged = true;
  }
}

function disableRedis(client: Redis): void {
  client.removeAllListeners();
  client.disconnect();
  redis = null;
}

if (config.redisUrl) {
  const client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: () => null,
    reconnectOnError: () => false,
  });

  client.on("error", (err) => {
    logFallback(
      `Redis: Could not connect (${err.message}). Using in-memory fallback for presence/typing.`
    );
    disableRedis(client);
  });

  redis = client;

  client.connect().catch(() => {
    logFallback(
      "Redis: Could not connect. Using in-memory fallback for presence/typing."
    );
    disableRedis(client);
  });
} else {
  console.warn("REDIS_URL not set. Using in-memory fallback for presence/typing.");
}

export function getRedis(): Redis | null {
  if (redis && redis.status === "ready") {
    return redis;
  }
  return null;
}

export function isRedisConnected(): boolean {
  return redis !== null && redis.status === "ready";
}

// In-memory fallbacks
const presenceStore = new Map<string, { status: string; expiresAt: number }>();
const typingStore = new Map<string, Map<string, number>>();
const socketUserMap = new Map<string, string>();

export const memoryStore = {
  setPresence(userId: string, status: string, ttlSeconds: number): void {
    presenceStore.set(userId, {
      status,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  getPresence(userId: string): string | null {
    const entry = presenceStore.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      presenceStore.delete(userId);
      return null;
    }
    return entry.status;
  },

  removePresence(userId: string): void {
    presenceStore.delete(userId);
  },

  setSocketUser(socketId: string, userId: string): void {
    socketUserMap.set(socketId, userId);
  },

  removeSocket(socketId: string): void {
    socketUserMap.delete(socketId);
  },

  getSocketUser(socketId: string): string | undefined {
    return socketUserMap.get(socketId);
  },

  addTyping(channelId: string, userId: string, ttlSeconds: number): void {
    if (!typingStore.has(channelId)) {
      typingStore.set(channelId, new Map());
    }
    typingStore.get(channelId)!.set(userId, Date.now() + ttlSeconds * 1000);
  },

  removeTyping(channelId: string, userId: string): void {
    typingStore.get(channelId)?.delete(userId);
  },

  getTypingUsers(channelId: string): string[] {
    const channelTyping = typingStore.get(channelId);
    if (!channelTyping) return [];
    const now = Date.now();
    const users: string[] = [];
    for (const [userId, expiresAt] of channelTyping.entries()) {
      if (now > expiresAt) {
        channelTyping.delete(userId);
      } else {
        users.push(userId);
      }
    }
    return users;
  },
};
