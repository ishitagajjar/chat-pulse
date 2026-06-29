import { useRef, useState } from "react";
import {
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTyping } from "@/hooks/useTyping";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { messageService } from "@/services/messageService";
import type { Message } from "@/types";

interface MessageInputProps {
  channelId: string;
  onSend: (payload: {
    content: string;
    type?: Message["type"];
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    parentId?: string;
  }) => void;
  parentId?: string;
  placeholder?: string;
}

export function MessageInput({
  channelId,
  onSend,
  parentId,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const { typingUsers, onInputChange, onBlur } = useTyping(channelId);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (uploading) return;
    if (!content.trim() && !file) return;

    setError("");
    setUploading(true);

    try {
      if (file) {
        const uploaded = await messageService.uploadFile(channelId, file);
        onSend({
          content: content.trim() || uploaded.fileName,
          type: uploaded.type,
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          fileSize: uploaded.fileSize,
          parentId,
        });
      } else {
        onSend({ content: content.trim(), parentId });
      }

      setContent("");
      setFile(null);
      onBlur();
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onInputChange();
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const canSend = (content.trim().length > 0 || file) && !uploading;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {!parentId && <TypingIndicator users={typingUsers} />}
      {file && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm">
          <span className="flex-1 truncate">{file.name}</span>
          <button type="button" onClick={() => setFile(null)}>
            <XMarkIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={1}
          className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-lg bg-indigo-500 p-2 text-white hover:bg-indigo-600 disabled:bg-indigo-300"
        >
          {uploading ? (
            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <PaperAirplaneIcon className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}
