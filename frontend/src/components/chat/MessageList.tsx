import { useEffect, useRef, useCallback } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { MessageItem } from "@/components/chat/MessageItem";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  highlightMessageId?: string;
  onReply?: (message: Message) => void;
}

function formatDateLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function shouldCompact(prev: Message | undefined, current: Message): boolean {
  if (!prev) return false;
  if (prev.user.id !== current.user.id) return false;
  const diff =
    new Date(current.createdAt).getTime() -
    new Date(prev.createdAt).getTime();
  return diff < 5 * 60 * 1000;
}

export function MessageList({
  messages,
  loading,
  hasMore,
  loadMore,
  highlightMessageId,
  onReply,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isAtBottomRef.current && containerRef.current && !highlightMessageId) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length, highlightMessageId]);

  useEffect(() => {
    if (!highlightMessageId) return;
    const el = document.getElementById(`message-${highlightMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-indigo-50");
      const timer = setTimeout(() => el.classList.remove("bg-indigo-50"), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightMessageId, messages]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        No messages yet. Start the conversation!
      </div>
    );
  }

  let lastDate = "";

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div ref={topSentinelRef} className="h-1" />
      {loading && (
        <div className="flex justify-center py-4">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}

      {messages.map((message, index) => {
        const dateKey = format(new Date(message.createdAt), "yyyy-MM-dd");
        const showDate = dateKey !== lastDate;
        lastDate = dateKey;
        const compact = shouldCompact(messages[index - 1], message);

        return (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className="transition-colors duration-500"
          >
            {showDate && (
              <div className="my-4 flex items-center justify-center">
                <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
                  {formatDateLabel(new Date(message.createdAt))}
                </span>
              </div>
            )}
            <MessageItem
              message={message}
              compact={compact && !showDate}
              onReply={onReply}
            />
          </div>
        );
      })}
    </div>
  );
}
