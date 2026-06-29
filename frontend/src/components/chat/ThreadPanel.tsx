import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { MessageItem } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import { messageService } from "@/services/messageService";
import type { Message } from "@/types";

interface ThreadPanelProps {
  parentMessage: Message;
  channelId: string;
  onClose: () => void;
  onSend: (payload: {
    content: string;
    type?: Message["type"];
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    parentId?: string;
  }) => void;
}

export function ThreadPanel({
  parentMessage,
  channelId,
  onClose,
  onSend,
}: ThreadPanelProps) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReplies = () => {
    messageService
      .getThreadReplies(parentMessage.id)
      .then((data) => setReplies(data.replies))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReplies();
  }, [parentMessage.id]);

  const handleSend = (payload: Parameters<typeof onSend>[0]) => {
    onSend({ ...payload, parentId: parentMessage.id });
    setTimeout(loadReplies, 500);
  };

  return (
    <div className="flex w-full flex-col border-l border-gray-200 bg-white md:w-96">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Thread</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <MessageItem message={parentMessage} />
        <div className="border-b border-gray-100 px-4 pb-2">
          <span className="text-xs font-medium text-gray-500">
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </span>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          replies.map((reply) => (
            <MessageItem key={reply.id} message={reply} />
          ))
        )}
      </div>

      <MessageInput
        channelId={channelId}
        onSend={handleSend}
        parentId={parentMessage.id}
        placeholder="Reply in thread..."
      />
    </div>
  );
}
