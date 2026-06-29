import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";

export interface ReactionNotification {
  id: string;
  channelId: string;
  channelName: string;
  messageId: string;
  emoji: string;
  userDisplayName: string;
  action: "add" | "remove";
}

export function useReactionNotifications(activeChannelId?: string) {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<ReactionNotification[]>(
    []
  );

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: Omit<ReactionNotification, "id">) => {
      if (data.channelId === activeChannelId) return;

      const notification: ReactionNotification = {
        ...data,
        id: `${data.messageId}-${Date.now()}`,
      };

      setNotifications((prev) => [...prev, notification]);

      setTimeout(() => dismiss(notification.id), 5000);
    };

    socket.on("reaction:notify", handler);
    return () => {
      socket.off("reaction:notify", handler);
    };
  }, [socket, activeChannelId, dismiss]);

  return { notifications, dismiss };
}
