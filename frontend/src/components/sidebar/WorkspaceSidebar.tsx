import { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ChannelItem } from "@/components/sidebar/ChannelItem";
import { Button } from "@/components/ui/Button";
import { channelService } from "@/services/channelService";
import { useSocket } from "@/hooks/useSocket";
import type { Channel } from "@/types";

interface WorkspaceSidebarProps {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  activeChannelId?: string;
  onCreateChannel: () => void;
  onCreateGroup: () => void;
  onOpenProfile?: () => void;
  userName?: string;
  channelRefreshKey?: number;
}

export function WorkspaceSidebar({
  workspaceId,
  workspaceSlug,
  workspaceName,
  activeChannelId,
  onCreateChannel,
  onCreateGroup,
  onOpenProfile,
  userName,
  channelRefreshKey = 0,
}: WorkspaceSidebarProps) {
  const { socket } = useSocket();
  const [channels, setChannels] = useState<Channel[]>([]);

  const loadChannels = () => {
    channelService.getByWorkspace(workspaceId).then(setChannels).catch(console.error);
  };

  useEffect(() => {
    loadChannels();
  }, [workspaceId, activeChannelId, channelRefreshKey]);

  useEffect(() => {
    if (!socket) return;

    const onUnread = (data: { channelId: string; count: number }) => {
      // Never show unread badge on the channel you're currently viewing
      if (data.channelId === activeChannelId) return;
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === data.channelId ? { ...ch, unreadCount: data.count } : ch
        )
      );
    };

    const onNewMessage = () => {
      if (!activeChannelId) loadChannels();
    };

    socket.on("unread:update", onUnread);
    socket.on("message:new", onNewMessage);

    return () => {
      socket.off("unread:update", onUnread);
      socket.off("message:new", onNewMessage);
    };
  }, [socket, activeChannelId, workspaceId]);

  // Clear unread for active channel locally
  useEffect(() => {
    if (!activeChannelId) return;
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === activeChannelId ? { ...ch, unreadCount: 0 } : ch
      )
    );
  }, [activeChannelId]);

  const publicChannels = channels.filter(
    (c) => c.type !== "DM" && c.type !== "GROUP_DM"
  );
  const conversationChannels = channels.filter(
    (c) => c.type === "DM" || c.type === "GROUP_DM"
  );

  return (
    <div className="flex h-full flex-col text-white">
      <div className="border-b border-gray-800 p-4">
        <h2 className="truncate text-lg font-bold">{workspaceName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Channels
            </span>
            <button
              onClick={onCreateChannel}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-0.5">
            {publicChannels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                workspaceSlug={workspaceSlug}
                isActive={ch.id === activeChannelId}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Direct Messages
            </span>
            <button
              onClick={onCreateGroup}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-800 hover:text-white"
              title="Create group"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-0.5">
            {conversationChannels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                workspaceSlug={workspaceSlug}
                isActive={ch.id === activeChannelId}
                dmDisplayName={
                  ch.type === "GROUP_DM"
                    ? ch.groupDisplayName ?? "Group"
                    : ch.dmPartner?.displayName ?? "Direct Message"
                }
                dmAvatarUrl={
                  ch.type === "GROUP_DM"
                    ? ch.groupMembers?.[0]?.avatarUrl
                    : ch.dmPartner?.avatarUrl
                }
                isGroup={ch.type === "GROUP_DM"}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 p-3 space-y-2">
        {onOpenProfile && userName && (
          <button
            onClick={onOpenProfile}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-medium text-white">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{userName}</span>
          </button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-300 hover:text-white"
          onClick={onCreateChannel}
        >
          <PlusIcon className="h-4 w-4" />
          Create Channel
        </Button>
      </div>
    </div>
  );
}
