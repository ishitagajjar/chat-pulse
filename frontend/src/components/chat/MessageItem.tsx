import { ReactionBar } from "@/components/chat/ReactionBar";
import { FilePreview } from "@/components/chat/FilePreview";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import type { Message } from "@/types";

interface MessageItemProps {
  message: Message;
  compact?: boolean;
  onReply?: (message: Message) => void;
}

export function MessageItem({ message, compact = false, onReply }: MessageItemProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isOwn = user?.id === message.user.id;

  const handleEdit = () => {
    if (!socket || !editContent.trim()) return;
    socket.emit("message:edit", {
      messageId: message.id,
      content: editContent,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    if (!socket) return;
    socket.emit("message:delete", { messageId: message.id });
  };

  if (message.type === "SYSTEM") {
    return (
      <div className="message-fade-in px-4 py-2 text-center text-xs text-gray-500">
        {message.content}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="group message-fade-in flex gap-2 px-4 py-0.5 hover:bg-gray-50">
        <span className="w-10 shrink-0 text-right text-xs text-gray-400 opacity-0 group-hover:opacity-100">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}
        </span>
        <div className="min-w-0 flex-1">
          {message.type === "IMAGE" || message.type === "FILE" ? (
            <FilePreview message={message} />
          ) : (
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
          {message.isEdited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
          <ReactionBar message={message} />
        </div>
      </div>
    );
  }

  return (
    <div className={`group message-fade-in relative flex gap-3 px-4 py-2 hover:bg-gray-50 ${message.pending ? "opacity-70" : ""}`}>
      <Avatar
        name={message.user.displayName}
        src={message.user.avatarUrl}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-gray-900">
            {message.user.displayName}
          </span>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(message.createdAt), {
              addSuffix: true,
            })}
          </span>
          {message.isEdited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              rows={2}
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={handleEdit}
                className="text-sm text-indigo-600 hover:underline"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.type === "IMAGE" || message.type === "FILE" ? (
              <FilePreview message={message} />
            ) : (
              <div className="prose prose-sm max-w-none text-gray-800">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
            <ReactionBar message={message} />
            {(message.replyCount ?? 0) > 0 && onReply && (
              <button
                onClick={() => onReply(message)}
                className="mt-1 text-xs text-indigo-600 hover:underline"
              >
                {message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
              </button>
            )}
          </>
        )}

        <div className="absolute right-4 top-2 hidden gap-1 group-hover:flex">
          {onReply && !message.pending && (
            <button
              onClick={() => onReply(message)}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-200"
            >
              Reply
            </button>
          )}
          {isOwn && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
