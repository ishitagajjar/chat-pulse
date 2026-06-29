import { useCallback, useEffect, useState } from "react";
import { messageService } from "@/services/messageService";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import type { Message } from "@/types";

function createOptimisticMessage(
  tempId: string,
  channelId: string,
  user: { id: string; displayName: string; avatarUrl: string | null },
  content: string,
  type: Message["type"] = "TEXT",
  fileUrl?: string,
  fileName?: string,
  fileSize?: number,
  parentId?: string
): Message {
  const now = new Date().toISOString();
  return {
    id: tempId,
    channelId,
    user,
    content,
    type,
    fileUrl: fileUrl ?? null,
    fileName: fileName ?? null,
    fileSize: fileSize ?? null,
    parentId: parentId ?? null,
    isEdited: false,
    reactions: [],
    createdAt: now,
    updatedAt: now,
    pending: true,
  };
}

export function useMessages(channelId: string | undefined) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchMessages = useCallback(
    async (before?: string) => {
      if (!channelId) return;
      setLoading(true);
      try {
        const data = await messageService.getByChannel(channelId, before);
        if (before) {
          setMessages((prev) => [...data, ...prev]);
        } else {
          setMessages(data);
        }
        setHasMore(data.length >= 50);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    },
    [channelId]
  );

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      return;
    }
    setHasMore(true);
    fetchMessages();
  }, [channelId, fetchMessages]);

  useEffect(() => {
    if (!socket || !channelId) return;

    socket.emit("channel:join", { channelId });

    const onNew = (message: Message & { clientMessageId?: string }) => {
      if (message.channelId !== channelId) return;
      setMessages((prev) => {
        let next = prev;
        if (message.clientMessageId) {
          next = prev.filter((m) => m.id !== message.clientMessageId);
        } else {
          next = prev.filter(
            (m) =>
              !m.pending ||
              m.user.id !== message.user.id ||
              m.content !== message.content
          );
        }
        if (next.some((m) => m.id === message.id)) return next;
        const { clientMessageId: _, pending: __, ...clean } = message as Message & {
          clientMessageId?: string;
          pending?: boolean;
        };
        return [...next, clean as Message];
      });
    };

    const onUpdated = (data: {
      messageId: string;
      content: string;
      isEdited: boolean;
      channelId: string;
    }) => {
      if (data.channelId === channelId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, content: data.content, isEdited: data.isEdited }
              : m
          )
        );
      }
    };

    const onDeleted = (data: { messageId: string; channelId: string }) => {
      if (data.channelId === channelId) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    };

    const onReactionUpdated = (data: {
      messageId: string;
      channelId: string;
      reactions: Message["reactions"];
    }) => {
      if (data.channelId !== channelId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m
        )
      );
    };

    socket.on("message:new", onNew);
    socket.on("message:updated", onUpdated);
    socket.on("message:deleted", onDeleted);
    socket.on("reaction:updated", onReactionUpdated);

    return () => {
      socket.emit("channel:leave", { channelId });
      socket.off("message:new", onNew);
      socket.off("message:updated", onUpdated);
      socket.off("message:deleted", onDeleted);
      socket.off("reaction:updated", onReactionUpdated);
    };
  }, [socket, channelId]);

  const sendMessage = useCallback(
    async (payload: {
      content: string;
      type?: Message["type"];
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      parentId?: string;
    }) => {
      if (!socket || !channelId || !user) return;

      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic = createOptimisticMessage(
        tempId,
        channelId,
        {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        payload.content.trim() || payload.fileName || "Attachment",
        payload.type ?? "TEXT",
        payload.fileUrl,
        payload.fileName,
        payload.fileSize,
        payload.parentId
      );

      setMessages((prev) => [...prev, optimistic]);

      socket.emit(
        "message:send",
        {
          channelId,
          content: payload.content.trim() || payload.fileName || "Attachment",
          type: payload.type ?? "TEXT",
          fileUrl: payload.fileUrl,
          fileName: payload.fileName,
          fileSize: payload.fileSize,
          parentId: payload.parentId,
          clientMessageId: tempId,
        },
        (response: { success: boolean; error?: string }) => {
          if (!response?.success) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
          }
        }
      );
    },
    [socket, channelId, user]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loading || messages.length === 0) return;
    const oldest = messages[0];
    fetchMessages(oldest.id);
  }, [hasMore, loading, messages, fetchMessages]);

  return { messages, loading, hasMore, loadMore, sendMessage, setMessages };
}
