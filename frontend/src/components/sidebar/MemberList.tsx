import { Avatar } from "@/components/ui/Avatar";
import { PresenceDot } from "@/components/PresenceDot";
import { usePresence } from "@/hooks/usePresence";
import type { WorkspaceMember } from "@/types";

interface MemberListProps {
  members: WorkspaceMember[];
  currentUserId?: string;
  onStartDM?: (userId: string) => void;
}

export function MemberList({
  members,
  currentUserId,
  onStartDM,
}: MemberListProps) {
  const { getStatus } = usePresence();

  const sorted = [...members].sort((a, b) => {
    const aOnline = getStatus(a.user.id, a.user.status) === "online" ? 0 : 1;
    const bOnline = getStatus(b.user.id, b.user.status) === "online" ? 0 : 1;
    if (aOnline !== bOnline) return aOnline - bOnline;
    return a.user.displayName.localeCompare(b.user.displayName);
  });

  return (
    <div className="p-4">
      <h3 className="mb-1 text-sm font-semibold text-gray-900">
        Members — {members.length}
      </h3>
      {onStartDM && (
        <p className="mb-3 text-xs text-gray-500">
          Click a member to start a direct message
        </p>
      )}
      <div className="space-y-1">
        {sorted.map((member) => {
          const status = getStatus(member.user.id, member.user.status);
          const isSelf = member.user.id === currentUserId;
          const canMessage = onStartDM && !isSelf;

          return (
            <button
              key={member.id}
              type="button"
              disabled={!canMessage}
              onClick={() => canMessage && onStartDM(member.user.id)}
              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                canMessage
                  ? "cursor-pointer hover:bg-gray-100"
                  : "cursor-default"
              }`}
            >
              <div className="relative">
                <Avatar
                  name={member.user.displayName}
                  src={member.user.avatarUrl}
                  size="md"
                />
                <PresenceDot status={status} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {member.user.displayName}
                  {isSelf && (
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      (you)
                    </span>
                  )}
                </p>
                <p className="text-xs capitalize text-gray-500">{status}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
