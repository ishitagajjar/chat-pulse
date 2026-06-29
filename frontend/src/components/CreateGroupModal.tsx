import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MemberPicker } from "@/components/MemberPicker";
import { channelService } from "@/services/channelService";
import { useSocket } from "@/hooks/useSocket";
import type { Channel, WorkspaceMember } from "@/types";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  members: WorkspaceMember[];
  currentUserId?: string;
  onCreated: (channel: Channel) => void;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  workspaceId,
  members,
  currentUserId,
  onCreated,
}: CreateGroupModalProps) {
  const { socket } = useSocket();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setSelectedIds([]);
    setAddEmail("");
    setError("");
  };

  const resolveEmailToUserId = (email: string): string | null => {
    const member = members.find(
      (m) => m.user.email.toLowerCase() === email.trim().toLowerCase()
    );
    return member?.user.id ?? null;
  };

  const handleAddByEmail = () => {
    const userId = resolveEmailToUserId(addEmail);
    if (!userId) {
      setError(
        "No workspace member found with this email. Invite them to the workspace first."
      );
      return;
    }
    if (!selectedIds.includes(userId)) {
      setSelectedIds([...selectedIds, userId]);
    }
    setAddEmail("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length < 2) {
      setError("Select at least 2 people for a group (3 including you).");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const channel = await channelService.createGroupDM(
        workspaceId,
        selectedIds,
        name.trim() || undefined
      );
      socket?.emit("channel:join", { channelId: channel.id });
      onCreated(channel);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Project Team"
        />

        <MemberPicker
          members={members}
          currentUserId={currentUserId}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          minSelection={0}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Add by email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <Button type="button" variant="secondary" onClick={handleAddByEmail}>
              Add
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Person must already be in this workspace
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
}
