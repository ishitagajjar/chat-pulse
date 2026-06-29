import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChatLayout } from "@/layouts/ChatLayout";
import { WorkspaceSidebar } from "@/components/sidebar/WorkspaceSidebar";
import { MemberList } from "@/components/sidebar/MemberList";
import { ChannelHeader } from "@/components/ChannelHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { ThreadPanel } from "@/components/chat/ThreadPanel";
import { CreateChannelModal } from "@/components/CreateChannelModal";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { GroupManageModal } from "@/components/GroupManageModal";
import { SearchMessages } from "@/components/SearchMessages";
import { ProfileModal } from "@/components/ProfileModal";
import { ReactionNotificationToasts } from "@/components/ReactionNotificationToasts";
import { useMessages } from "@/hooks/useMessages";
import { useReactionNotifications } from "@/hooks/useReactionNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useSocketContext } from "@/contexts/SocketContext";
import { workspaceService } from "@/services/workspaceService";
import { channelService } from "@/services/channelService";
import type { Channel, Message, Workspace, WorkspaceMember } from "@/types";

export function Chat() {
  const { workspaceSlug, channelId } = useParams<{
    workspaceSlug: string;
    channelId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isConnected } = useSocketContext();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupManageOpen, setGroupManageOpen] = useState(false);
  const [channelRefreshKey, setChannelRefreshKey] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string>();

  const activeChannelId = channelId || activeChannel?.id;
  const { messages, loading, hasMore, loadMore, sendMessage } =
    useMessages(activeChannelId);
  const { notifications, dismiss: dismissReactionNotification } =
    useReactionNotifications(activeChannelId);

  useEffect(() => {
    const state = location.state as { highlightMessageId?: string } | null;
    if (state?.highlightMessageId) {
      setHighlightMessageId(state.highlightMessageId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!workspaceSlug) return;

    workspaceService
      .getAll()
      .then((workspaces) => {
        const ws = workspaces.find((w) => w.slug === workspaceSlug);
        if (!ws) {
          navigate("/workspaces");
          return;
        }
        setWorkspace(ws);
        return Promise.all([
          workspaceService.getMembers(ws.id),
          channelService.getByWorkspace(ws.id),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [membersData, channels] = result as [WorkspaceMember[], Channel[]];
        setMembers(membersData);

        if (channelId) {
          const ch = channels.find((c) => c.id === channelId);
          if (ch) setActiveChannel(ch);
        } else {
          const general = channels.find((c) => c.name === "general");
          if (general) {
            navigate(`/w/${workspaceSlug}/c/${general.id}`, { replace: true });
          }
        }
      })
      .catch(console.error);
  }, [workspaceSlug, channelId, navigate]);

  useEffect(() => {
    if (!workspace?.id || !isConnected) return;
    workspaceService.getMembers(workspace.id).then(setMembers).catch(console.error);
  }, [workspace?.id, isConnected]);

  useEffect(() => {
    if (!channelId) return;
    channelService
      .getById(channelId)
      .then(setActiveChannel)
      .catch(console.error);
    setThreadMessage(null);
  }, [channelId]);

  const handleStartDM = async (targetUserId: string) => {
    if (!workspace) return;
    try {
      const channel = await channelService.createDM(workspace.id, targetUserId);
      setShowMembers(false);
      navigate(`/w/${workspace.slug}/dm/${channel.id}`);
    } catch (err) {
      console.error("Failed to start DM:", err);
    }
  };

  const handleReactionNotificationNavigate = (
    targetChannelId: string,
    messageId: string
  ) => {
    if (!workspace) return;
    const channel = activeChannel?.id === targetChannelId ? activeChannel : null;
    const isConversation =
      channel?.type === "DM" || channel?.type === "GROUP_DM";
    const path = isConversation
      ? `/w/${workspace.slug}/dm/${targetChannelId}`
      : `/w/${workspace.slug}/c/${targetChannelId}`;
    navigate(path, { state: { highlightMessageId: messageId } });
  };

  const handleGroupCreated = (channel: Channel) => {
    setChannelRefreshKey((k) => k + 1);
    navigate(`/w/${workspace!.slug}/dm/${channel.id}`);
  };

  const handleChannelUpdated = (channel: Channel) => {
    setActiveChannel(channel);
    setChannelRefreshKey((k) => k + 1);
  };

  const handleLeftGroup = () => {
    setGroupManageOpen(false);
    setActiveChannel(null);
    setChannelRefreshKey((k) => k + 1);
    channelService
      .getByWorkspace(workspace!.id)
      .then((channels) => {
        const general = channels.find((c) => c.name === "general");
        if (general) {
          navigate(`/w/${workspace!.slug}/c/${general.id}`, { replace: true });
        } else {
          navigate(`/w/${workspace!.slug}`, { replace: true });
        }
      })
      .catch(() => navigate(`/w/${workspace!.slug}`, { replace: true }));
  };

  const headerMemberCount =
    activeChannel?.type === "GROUP_DM"
      ? activeChannel.groupMembers?.length ?? 0
      : members.length;

  if (!workspace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <ChatLayout
        sidebar={
          <WorkspaceSidebar
            workspaceId={workspace.id}
            workspaceSlug={workspace.slug}
            workspaceName={workspace.name}
            activeChannelId={activeChannelId}
            channelRefreshKey={channelRefreshKey}
            onCreateChannel={() => setCreateChannelOpen(true)}
            onCreateGroup={() => setCreateGroupOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            userName={user?.displayName}
          />
        }
        header={
          <ChannelHeader
            channel={activeChannel}
            memberCount={headerMemberCount}
            onToggleMembers={() => setShowMembers(!showMembers)}
            onSearch={() => setSearchOpen(true)}
            onManageGroup={
              activeChannel?.type === "GROUP_DM"
                ? () => setGroupManageOpen(true)
                : undefined
            }
          />
        }
        main={
          activeChannelId ? (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <MessageList
                  messages={messages}
                  loading={loading}
                  hasMore={hasMore}
                  loadMore={loadMore}
                  highlightMessageId={highlightMessageId}
                  onReply={setThreadMessage}
                />
                <MessageInput
                  channelId={activeChannelId}
                  onSend={sendMessage}
                />
              </div>
              {threadMessage && (
                <ThreadPanel
                  parentMessage={threadMessage}
                  channelId={activeChannelId}
                  onClose={() => setThreadMessage(null)}
                  onSend={sendMessage}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-500">
              Select a channel to start chatting
            </div>
          )
        }
        rightPanel={
          <MemberList
            members={members}
            currentUserId={user?.id}
            onStartDM={handleStartDM}
          />
        }
        showRightPanel={showMembers}
        onCloseRightPanel={() => setShowMembers(false)}
      />

      <CreateChannelModal
        isOpen={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        workspaceId={workspace.id}
        onCreated={(ch) => navigate(`/w/${workspace.slug}/c/${ch.id}`)}
      />

      <CreateGroupModal
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        workspaceId={workspace.id}
        members={members}
        currentUserId={user?.id}
        onCreated={handleGroupCreated}
      />

      <GroupManageModal
        isOpen={groupManageOpen}
        onClose={() => setGroupManageOpen(false)}
        channel={activeChannel?.type === "GROUP_DM" ? activeChannel : null}
        workspaceMembers={members}
        currentUserId={user?.id}
        onUpdated={handleChannelUpdated}
        onLeft={handleLeftGroup}
      />

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {activeChannelId && (
        <SearchMessages
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          channelId={activeChannelId}
          onSelectMessage={(messageId) => setHighlightMessageId(messageId)}
        />
      )}

      <ReactionNotificationToasts
        notifications={notifications}
        onDismiss={dismissReactionNotification}
        onNavigate={handleReactionNotificationNavigate}
      />
    </>
  );
}
