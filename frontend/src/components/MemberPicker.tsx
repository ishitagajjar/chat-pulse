import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import type { WorkspaceMember } from "@/types";

interface MemberPickerProps {
  members: WorkspaceMember[];
  currentUserId?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeIds?: string[];
  minSelection?: number;
}

export function MemberPicker({
  members,
  currentUserId,
  selectedIds,
  onChange,
  excludeIds = [],
  minSelection = 0,
}: MemberPickerProps) {
  const [search, setSearch] = useState("");

  const available = useMemo(() => {
    const excluded = new Set([currentUserId, ...excludeIds]);
    return members
      .filter((m) => !excluded.has(m.user.id))
      .filter((m) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          m.user.displayName.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.user.displayName.localeCompare(b.user.displayName));
  }, [members, currentUserId, excludeIds, search]);

  const toggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      if (selectedIds.length <= minSelection) return;
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        label="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="e.g. Alice or alice@demo.com"
      />
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
        {available.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-gray-500">
            No contacts found
          </p>
        ) : (
          available.map((member) => {
            const checked = selectedIds.includes(member.user.id);
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggle(member.user.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                  checked ? "bg-indigo-50" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="rounded border-gray-300"
                />
                <Avatar
                  name={member.user.displayName}
                  src={member.user.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {member.user.displayName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {member.user.email}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-gray-500">
        {selectedIds.length} selected
        {minSelection > 0 && ` (minimum ${minSelection})`}
      </p>
    </div>
  );
}
