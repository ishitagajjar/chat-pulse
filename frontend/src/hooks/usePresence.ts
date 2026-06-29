import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import { useSocketContext } from "@/contexts/SocketContext";

export type PresenceStatus = "online" | "offline" | "away";

function normalizeApiStatus(status?: string): PresenceStatus | null {
  if (!status) return null;
  const lower = status.toLowerCase();
  if (lower === "online") return "online";
  if (lower === "away") return "away";
  if (lower === "offline") return "offline";
  return null;
}

export function usePresence() {
  const { socket } = useSocket();
  const { isConnected } = useSocketContext();
  const { user } = useAuth();
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceStatus>>(
    new Map()
  );

  useEffect(() => {
    if (!socket) return;

    const handler = (data: { userId: string; status: string }) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data.status as PresenceStatus);
        return next;
      });
    };

    socket.on("presence:update", handler);
    return () => {
      socket.off("presence:update", handler);
    };
  }, [socket]);

  // Mark self online when socket connects
  useEffect(() => {
    if (!user?.id || !isConnected) return;
    setPresenceMap((prev) => {
      const next = new Map(prev);
      next.set(user.id, "online");
      return next;
    });
  }, [user?.id, isConnected]);

  const getStatus = useCallback(
    (userId: string, apiStatus?: string): PresenceStatus => {
      const live = presenceMap.get(userId);
      if (live) return live;

      if (userId === user?.id && isConnected) return "online";

      const fromApi = normalizeApiStatus(apiStatus);
      if (fromApi) return fromApi;

      return "offline";
    },
    [presenceMap, user?.id, isConnected]
  );

  const isOnline = useCallback(
    (userId: string, apiStatus?: string) =>
      getStatus(userId, apiStatus) === "online",
    [getStatus]
  );

  const onlineCount = Array.from(presenceMap.values()).filter(
    (s) => s === "online"
  ).length;

  return { isOnline, getStatus, onlineCount, presenceMap };
}
