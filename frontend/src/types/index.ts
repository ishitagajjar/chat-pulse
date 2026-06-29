export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: "ONLINE" | "OFFLINE" | "AWAY";
  lastSeenAt: string | null;
  createdAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  iconUrl: string | null;
  memberCount?: number;
}

export interface WorkspaceMember {
  id: string;
  user: User;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  type: "PUBLIC" | "PRIVATE" | "DM" | "GROUP_DM";
  createdBy?: Pick<User, "id" | "displayName" | "avatarUrl">;
  createdById?: string;
  unreadCount?: number;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    type: string;
  } | null;
  dmPartner?: Pick<User, "id" | "displayName" | "avatarUrl"> | null;
  groupMembers?: Pick<User, "id" | "displayName" | "avatarUrl" | "email">[];
  groupDisplayName?: string | null;
  members?: {
    id: string;
    userId: string;
    joinedAt: string;
    user: Pick<User, "id" | "displayName" | "avatarUrl" | "email" | "status">;
  }[];
}

export interface Reaction {
  id?: string;
  emoji: string;
  count: number;
  users: Pick<User, "id" | "displayName">[];
  reacted: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  user: Pick<User, "id" | "displayName" | "avatarUrl">;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  parentId: string | null;
  isEdited: boolean;
  reactions: Reaction[];
  createdAt: string;
  updatedAt: string;
  replyCount?: number;
  pending?: boolean;
}

export interface ApiResponse<T> {
  IsSuccess: boolean;
  Data: T | null;
  Message: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface SocketEvents {
  "message:send": {
    channelId: string;
    content: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  };
  "message:edit": { messageId: string; content: string };
  "message:delete": { messageId: string };
  "typing:start": { channelId: string };
  "typing:stop": { channelId: string };
  "reaction:add": { messageId: string; emoji: string };
  "reaction:remove": { messageId: string; emoji: string };
  "channel:join": { channelId: string };
  "channel:leave": { channelId: string };
  "message:new": Message & { clientMessageId?: string };
  "message:updated": {
    messageId: string;
    content: string;
    isEdited: boolean;
    channelId: string;
  };
  "message:deleted": { messageId: string; channelId: string };
  "typing:update": { channelId: string; users: string[] };
  "reaction:updated": { messageId: string; channelId: string; reactions: Reaction[] };
  "reaction:notify": {
    channelId: string;
    channelName: string;
    messageId: string;
    emoji: string;
    userDisplayName: string;
    action: "add" | "remove";
  };
  "presence:update": { userId: string; status: string };
  "channel:created": Channel;
  "unread:update": { channelId: string; count: number };
}
