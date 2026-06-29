import { Link } from "react-router-dom";
import {
  HashtagIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import type { Channel } from "@/types";

interface ChannelItemProps {
  channel: Channel;
  workspaceSlug: string;
  isActive: boolean;
  dmDisplayName?: string;
  dmAvatarUrl?: string | null;
  isGroup?: boolean;
}

export function ChannelItem({
  channel,
  workspaceSlug,
  isActive,
  dmDisplayName,
  dmAvatarUrl,
  isGroup = false,
}: ChannelItemProps) {
  const isConversation = channel.type === "DM" || channel.type === "GROUP_DM";
  const path = isConversation
    ? `/w/${workspaceSlug}/dm/${channel.id}`
    : `/w/${workspaceSlug}/c/${channel.id}`;

  const displayName = isConversation
    ? dmDisplayName || (isGroup ? "Group" : "Direct Message")
    : channel.name;
  const hasUnread = (channel.unreadCount ?? 0) > 0;

  return (
    <Link
      to={path}
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
        isActive
          ? "bg-indigo-600 text-white"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      } ${hasUnread && !isActive ? "font-semibold" : ""}`}
    >
      {isConversation ? (
        isGroup ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
            {(displayName.charAt(0) || "G").toUpperCase()}
          </span>
        ) : (
          <Avatar name={displayName} src={dmAvatarUrl} size="sm" />
        )
      ) : channel.type === "PRIVATE" ? (
        <LockClosedIcon className="h-4 w-4 shrink-0" />
      ) : (
        <HashtagIcon className="h-4 w-4 shrink-0" />
      )}
      <span className="flex-1 truncate">{displayName}</span>
      {hasUnread && !isActive && (
        <Badge variant="red">{channel.unreadCount}</Badge>
      )}
    </Link>
  );
}
