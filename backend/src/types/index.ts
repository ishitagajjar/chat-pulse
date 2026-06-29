import { Request } from "express";

export interface ApiResponseBody<T> {
  IsSuccess: boolean;
  Data: T | null;
  Message: string;
}

export interface MessageWithUser {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  parentId: string | null;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  reactions?: ReactionGroup[];
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: { id: string; displayName: string }[];
  reacted: boolean;
}

export interface SocketUser {
  userId: string;
  socketId: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
