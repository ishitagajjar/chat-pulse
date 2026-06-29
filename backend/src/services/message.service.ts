import { MessageType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { uploadFile } from "../lib/cloudinary";
import { AppError } from "../middlewares/errorHandler";
import { ReactionGroup } from "../types";

const DEFAULT_LIMIT = 50;

function groupReactions(
  reactions: {
    id: string;
    emoji: string;
    user: { id: string; displayName: string };
    userId: string;
  }[],
  currentUserId: string
): ReactionGroup[] {
  const map = new Map<string, ReactionGroup>();

  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count++;
      existing.users.push({ id: r.user.id, displayName: r.user.displayName });
      if (r.userId === currentUserId) existing.reacted = true;
    } else {
      map.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        users: [{ id: r.user.id, displayName: r.user.displayName }],
        reacted: r.userId === currentUserId,
      });
    }
  }

  return Array.from(map.values());
}

async function assertChannelMember(channelId: string, userId: string) {
  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (!member) {
    throw new AppError(403, "Not a member of this channel");
  }
  return member;
}

export const messageService = {
  async getByChannel(
    channelId: string,
    userId: string,
    before?: string,
    limit = DEFAULT_LIMIT
  ) {
    await assertChannelMember(channelId, userId);

    const cursor = before
      ? await prisma.message.findUnique({ where: { id: before } })
      : null;

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        parentId: null,
        ...(cursor ? { createdAt: { lt: cursor.createdAt } } : {}),
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, displayName: true } },
          },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    await prisma.channelMember.update({
      where: { channelId_userId: { channelId, userId } },
      data: { lastReadAt: new Date() },
    });

    return messages
      .reverse()
      .map((m) => ({
        ...m,
        reactions: groupReactions(m.reactions, userId),
        replyCount: m._count.replies,
      }));
  },

  async create(
    channelId: string,
    userId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    parentId?: string
  ) {
    await assertChannelMember(channelId, userId);

    if (parentId) {
      const parent = await prisma.message.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.channelId !== channelId) {
        throw new AppError(400, "Invalid thread parent");
      }
    }

    const message = await prisma.message.create({
      data: {
        channelId,
        userId,
        content,
        type,
        fileUrl,
        fileName,
        fileSize,
        parentId,
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        reactions: true,
      },
    });

    return { ...message, reactions: [] };
  },

  async update(messageId: string, userId: string, content: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new AppError(404, "Message not found");
    }
    if (message.userId !== userId) {
      throw new AppError(403, "Cannot edit another user's message");
    }

    return prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
    });
  },

  async delete(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new AppError(404, "Message not found");
    }
    if (message.userId !== userId) {
      throw new AppError(403, "Cannot delete another user's message");
    }

    await prisma.message.delete({ where: { id: messageId } });
    return message;
  },

  async getThreadReplies(messageId: string, userId: string) {
    const parent = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { replies: true } },
      },
    });
    if (!parent) throw new AppError(404, "Message not found");
    await assertChannelMember(parent.channelId, userId);

    const replies = await prisma.message.findMany({
      where: { parentId: messageId },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        reactions: {
          include: { user: { select: { id: true, displayName: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      parent: { ...parent, reactions: [] },
      replies: replies.map((m) => ({
        ...m,
        reactions: groupReactions(m.reactions, userId),
      })),
      replyCount: parent._count.replies,
    };
  },

  async uploadAttachment(
    channelId: string,
    userId: string,
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string
  ) {
    await assertChannelMember(channelId, userId);

    const isImage = mimeType.startsWith("image/");
    const folder = isImage
      ? "chatpulse/messages/images"
      : "chatpulse/messages/files";
    const result = await uploadFile(
      fileBuffer,
      fileName,
      folder,
      isImage ? "image" : "raw"
    );

    return {
      fileUrl: result.secure_url,
      fileName,
      fileSize: result.bytes,
      type: isImage ? MessageType.IMAGE : MessageType.FILE,
    };
  },

  async search(channelId: string, userId: string, query: string) {
    await assertChannelMember(channelId, userId);

    return prisma.message.findMany({
      where: {
        channelId,
        content: { contains: query, mode: "insensitive" },
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        channel: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  groupReactions,
};
