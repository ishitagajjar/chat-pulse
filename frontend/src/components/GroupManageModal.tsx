import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MemberPicker } from "@/components/MemberPicker";
import { channelService } from "@/services/channelService";
import type { Channel, WorkspaceMember } from "@/types";

interface GroupManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  workspaceMembers: WorkspaceMember[];
  currentUserId?: string;
  onUpdated: (channel: Channel) => void;
  onLeft: () => void;
}

export function GroupManageModal({
  isOpen,
  onClose,
  channel,
  workspaceMembers,
  currentUserId,
  onUpdated,
  onLeft,
}: GroupManageModalProps) {
  const [name, setName] = useState("");
  const [groupMembers, setGroupMembers] = useState<
    NonNullable<Channel["groupMembers"]>
  >([]);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCreator =
    channel?.createdById === currentUserId ||
    channel?.createdBy?.id === currentUserId;

  useEffect(() => {
    if (!channel || !isOpen) return;
    const customName =
      channel.name && !channel.name.startsWith("group-") ? channel.name : "";
    setName(customName);
    setGroupMembers(channel.groupMembers ?? []);
    setShowAddPicker(false);
    setSelectedToAdd([]);
    setAddEmail("");
    setError("");
  }, [channel, isOpen]);

  if (!channel) return null;

  const refreshChannel = async () => {
    const updated = await channelService.getById(channel.id);
    setGroupMembers(updated.groupMembers ?? []);
    onUpdated(updated);
  };

  const handleRename = async () => {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const updated = await channelService.updateGroupDM(channel.id, name.trim());
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename group");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSelected = async () => {
    if (selectedToAdd.length === 0) return;
    setLoading(true);
    setError("");
    try {
      for (const userId of selectedToAdd) {
        await channelService.addGroupMember(channel.id, { userId });
      }
      await refreshChannel();
      setSelectedToAdd([]);
      setShowAddPicker(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleAddByEmail = async () => {
    if (!addEmail.trim()) return;
    setLoading(true);
    setError("");
    try {
      await channelService.addGroupMember(channel.id, {
        email: addEmail.trim(),
      });
      await refreshChannel();
      setAddEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await channelService.removeGroupMember(channel.id, userId);
      if (result.left && userId === currentUserId) {
        onLeft();
        onClose();
        return;
      }
      await refreshChannel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const existingMemberIds = groupMembers.map((m) => m.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Group">
      <div className="space-y-5">
        <div className="space-y-2">
          <Input
            label="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Project Team"
          />
          <Button
            type="button"
            size="sm"
            loading={loading}
            onClick={handleRename}
          >
            Save name
          </Button>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-900">
            Members ({groupMembers.length})
          </h3>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {groupMembers.map((member) => {
              const isSelf = member.id === currentUserId;
              const canRemove =
                isSelf || (isCreator && !isSelf);
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      name={member.displayName}
                      src={member.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {member.displayName}
                        {isSelf && (
                          <span className="ml-1 text-xs text-gray-400">(you)</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  {canRemove && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={loading}
                      onClick={() => handleRemove(member.id)}
                    >
                      {isSelf ? "Leave" : "Remove"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-900">Add members</h3>
          {!showAddPicker ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddPicker(true)}
            >
              Pick from contacts
            </Button>
          ) : (
            <>
              <MemberPicker
                members={workspaceMembers}
                currentUserId={currentUserId}
                selectedIds={selectedToAdd}
                onChange={setSelectedToAdd}
                excludeIds={existingMemberIds}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  loading={loading}
                  onClick={handleAddSelected}
                  disabled={selectedToAdd.length === 0}
                >
                  Add selected
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowAddPicker(false);
                    setSelectedToAdd([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="Add by email"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={loading}
              onClick={handleAddByEmail}
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Search contacts by name; add directly by email (must be in workspace)
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
