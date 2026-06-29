import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { Message } from "@/types";

const COMMON_EMOJIS = [
  "👍", "❤️", "😂", "🔥", "👀", "🚀", "🎉", "💯",
  "👏", "🙌", "😮", "😢", "🤔", "✅", "❌", "⭐",
  "💪", "🙏", "😎", "🤝",
];

interface ReactionBarProps {
  message: Message;
}

export function ReactionBar({ message }: ReactionBarProps) {
  const { socket } = useSocket();
  const [showPicker, setShowPicker] = useState(false);

  const toggleReaction = (emoji: string, reacted: boolean) => {
    if (!socket) return;
    if (reacted) {
      socket.emit("reaction:remove", { messageId: message.id, emoji });
    } else {
      socket.emit("reaction:add", { messageId: message.id, emoji });
    }
  };

  return (
    <div className="relative mt-1 flex flex-wrap items-center gap-1">
      {message.reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => toggleReaction(reaction.emoji, reaction.reacted)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            reaction.reacted
              ? "border-indigo-300 bg-indigo-50"
              : "border-gray-200 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <span>{reaction.emoji}</span>
          <span className="text-gray-600">{reaction.count}</span>
        </button>
      ))}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
      >
        +
      </button>
      {showPicker && (
        <div className="absolute bottom-full left-0 z-10 mb-1 grid grid-cols-5 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                toggleReaction(emoji, false);
                setShowPicker(false);
              }}
              className="rounded p-1 text-lg hover:bg-gray-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
