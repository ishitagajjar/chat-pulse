import {
  HashtagIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { Channel } from "@/types";

interface ChannelHeaderProps {
  channel: Channel | null;
  memberCount: number;
  onToggleMembers: () => void;
  onSearch: () => void;
  onManageGroup?: () => void;
}

export function ChannelHeader({
  channel,
  memberCount,
  onToggleMembers,
  onSearch,
  onManageGroup,
}: ChannelHeaderProps) {
  if (!channel) {
    return (
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Select a channel</h1>
      </div>
    );
  }

  const isDM = channel.type === "DM";
  const isGroup = channel.type === "GROUP_DM";
  const title = isDM
    ? channel.dmPartner?.displayName ?? "Direct Message"
    : isGroup
      ? channel.groupDisplayName ?? "Group"
      : channel.name;

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {!isDM && !isGroup && (
            <HashtagIcon className="h-5 w-5 text-gray-500" />
          )}
          <h1 className="truncate text-lg font-semibold text-gray-900">
            {title}
          </h1>
        </div>
        {isGroup && (
          <p className="truncate text-sm text-gray-500">
            {memberCount} members
          </p>
        )}
        {channel.description && !isGroup && (
          <p className="truncate text-sm text-gray-500">{channel.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isGroup && onManageGroup && (
          <button
            onClick={onManageGroup}
            className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Manage
          </button>
        )}
        <button
          onClick={onSearch}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          title="Search messages"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onToggleMembers}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          <UsersIcon className="h-5 w-5" />
          <span>{isGroup ? memberCount : memberCount}</span>
        </button>
      </div>
    </div>
  );
}
