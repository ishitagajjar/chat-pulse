import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

export function useTyping(channelId: string | undefined) {
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const lastEmitRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket || !channelId) return;

    const handler = (data: { channelId: string; users: string[] }) => {
      if (data.channelId === channelId) {
        setTypingUsers(data.users);
      }
    };

    socket.on("typing:update", handler);
    return () => {
      socket.off("typing:update", handler);
    };
  }, [socket, channelId]);

  const stopTyping = useCallback(() => {
    if (!socket || !channelId) return;
    socket.emit("typing:stop", { channelId });
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, [socket, channelId]);

  const onInputChange = useCallback(() => {
    if (!socket || !channelId) return;

    const now = Date.now();
    if (now - lastEmitRef.current > 3000) {
      socket.emit("typing:start", { channelId });
      lastEmitRef.current = now;
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, channelId, stopTyping]);

  const onBlur = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  return { typingUsers, onInputChange, onBlur };
}
