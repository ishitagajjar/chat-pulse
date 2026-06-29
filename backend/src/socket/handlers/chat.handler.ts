import { Server, Socket } from "socket.io";
import { z } from "zod";
import { MessageType } from "@prisma/client";
import { messageService } from "../../services/message.service";
import { prisma } from "../../lib/prisma";

const sendSchema = z.object({
  channelId: z.string().uuid(),
  content: z.string(),
  type: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"]).optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  parentId: z.string().uuid().optional(),
  clientMessageId: z.string().optional(),
}).refine((d) => d.content.trim().length > 0 || d.fileUrl, {
  message: "Message content or file is required",
});

const editSchema = z.object({
  messageId: z.string().uuid(),
  content: z.string().min(1),
});

const deleteSchema = z.object({
  messageId: z.string().uuid(),
});

export function registerChatHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;

  socket.on("message:send", async (data, callback) => {
    try {
      const parsed = sendSchema.parse(data);
      const message = await messageService.create(
        parsed.channelId,
        userId,
        parsed.content.trim() || parsed.fileName || "Attachment",
        (parsed.type as MessageType) ?? MessageType.TEXT,
        parsed.fileUrl,
        parsed.fileName,
        parsed.fileSize,
        parsed.parentId
      );

      io.to(parsed.channelId).emit("message:new", {
        ...message,
        clientMessageId: parsed.clientMessageId,
      });

      const members = await prisma.channelMember.findMany({
        where: { channelId: parsed.channelId, userId: { not: userId } },
      });

      for (const member of members) {
        const socketsInChannel = await io.in(parsed.channelId).fetchSockets();
        const isViewing = socketsInChannel.some(
          (s) => s.data.userId === member.userId
        );
        if (isViewing) continue;

        const unreadCount = await prisma.message.count({
          where: {
            channelId: parsed.channelId,
            createdAt: { gt: member.lastReadAt },
            userId: { not: member.userId },
          },
        });
        io.to(`user:${member.userId}`).emit("unread:update", {
          channelId: parsed.channelId,
          count: unreadCount,
        });
      }

      callback?.({ success: true, message });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      callback?.({ success: false, error: message });
    }
  });

  socket.on("message:edit", async (data) => {
    try {
      const parsed = editSchema.parse(data);
      const updated = await messageService.update(
        parsed.messageId,
        userId,
        parsed.content
      );
      io.to(updated.channelId).emit("message:updated", {
        messageId: updated.id,
        content: updated.content,
        isEdited: updated.isEdited,
        channelId: updated.channelId,
      });
    } catch (err) {
      console.error("message:edit error:", err);
    }
  });

  socket.on("message:delete", async (data) => {
    try {
      const parsed = deleteSchema.parse(data);
      const deleted = await messageService.delete(parsed.messageId, userId);
      io.to(deleted.channelId).emit("message:deleted", {
        messageId: deleted.id,
        channelId: deleted.channelId,
      });
    } catch (err) {
      console.error("message:delete error:", err);
    }
  });

  socket.on("channel:join", async (data: { channelId: string }) => {
    socket.join(data.channelId);
    socket.join(`user:${userId}`);

    await prisma.channelMember.updateMany({
      where: { channelId: data.channelId, userId },
      data: { lastReadAt: new Date() },
    });
  });

  socket.on("channel:leave", (data: { channelId: string }) => {
    socket.leave(data.channelId);
  });
}
