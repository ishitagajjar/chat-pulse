import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { channelService } from "@/services/channelService";
import { useSocket } from "@/hooks/useSocket";
import type { Channel } from "@/types";

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onCreated: (channel: Channel) => void;
}

export function CreateChannelModal({
  isOpen,
  onClose,
  workspaceId,
  onCreated,
}: CreateChannelModalProps) {
  const { socket } = useSocket();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const channel = await channelService.create(workspaceId, {
        name,
        description: description || undefined,
        type,
      });
      socket?.emit("channel:join", { channelId: channel.id });
      onCreated(channel);
      onClose();
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Channel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Channel name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. announcements"
          required
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            rows={3}
            placeholder="What's this channel about?"
          />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={type === "PUBLIC"}
              onChange={() => setType("PUBLIC")}
            />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={type === "PRIVATE"}
              onChange={() => setType("PRIVATE")}
            />
            Private
          </label>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
