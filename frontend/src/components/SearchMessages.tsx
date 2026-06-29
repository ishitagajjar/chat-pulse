import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { messageService } from "@/services/messageService";
import { formatDistanceToNow } from "date-fns";
import type { Message } from "@/types";

interface SearchMessagesProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  onSelectMessage: (messageId: string) => void;
}

export function SearchMessages({
  isOpen,
  onClose,
  channelId,
  onSelectMessage,
}: SearchMessagesProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await messageService.search(channelId, query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, channelId]);

  const handleSelect = (message: Message) => {
    onSelectMessage(message.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Messages">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search in this channel..."
        autoFocus
      />
      <div className="mt-4 max-h-80 overflow-y-auto">
        {loading && (
          <p className="text-center text-sm text-gray-500">Searching...</p>
        )}
        {!loading && query && results.length === 0 && (
          <p className="text-center text-sm text-gray-500">No results found</p>
        )}
        {results.map((msg) => (
          <button
            key={msg.id}
            onClick={() => handleSelect(msg)}
            className="w-full rounded-lg p-3 text-left hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {msg.user.displayName}
              </span>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(msg.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-gray-600">{msg.content}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
}
