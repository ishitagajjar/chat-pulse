import { Server, Socket } from "socket.io";
import { z } from "zod";
import { ChannelType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { messageService } from "../../services/message.service";

const reactionSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().min(1).max(10),
});

function channelLabel(name: string, type: ChannelType): string {
  if (type === ChannelType.DM) return "Direct Message";
  if (type === ChannelType.GROUP_DM) {
    return name.startsWith("group-") ? "Group" : name;
  }
  return `#${name}`;
}

async function broadcastReactionChange(
  io: Server,
  message: { id: string; channelId: string },
  actorUserId: string,
  emoji: string,
  action: "add" | "remove"
): Promise<void> {
  const [reactions, channel, actor, members, socketsInChannel] =
    await Promise.all([
      prisma.reaction.findMany({
        where: { messageId: message.id },
        include: { user: { select: { id: true, displayName: true } } },
      }),
      prisma.channel.findUnique({
        where: { id: message.channelId },
        select: { name: true, type: true },
      }),
      prisma.user.findUnique({
        where: { id: actorUserId },
        select: { displayName: true },
      }),
      prisma.channelMember.findMany({
        where: { channelId: message.channelId },
        select: { userId: true },
      }),
      io.in(message.channelId).fetchSockets(),
    ]);

  if (!channel || !actor) return;

  const viewingUserIds = new Set(
    socketsInChannel.map((s) => s.data.userId as string)
  );

  for (const member of members) {
    const grouped = messageService.groupReactions(reactions, member.userId);

    if (viewingUserIds.has(member.userId)) {
      io.to(`user:${member.userId}`).emit("reaction:updated", {
        messageId: message.id,
        channelId: message.channelId,
        reactions: grouped,
      });
    } else if (member.userId !== actorUserId) {
      io.to(`user:${member.userId}`).emit("reaction:notify", {
        channelId: message.channelId,
        channelName: channelLabel(channel.name, channel.type),
        messageId: message.id,
        emoji,
        userDisplayName: actor.displayName,
        action,
      });
    }
  }
}

export function registerReactionHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;

  socket.on("reaction:add", async (data) => {
    try {
      const { messageId, emoji } = reactionSchema.parse(data);

      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!message) return;

      await prisma.reaction.upsert({
        where: {
          messageId_userId_emoji: { messageId, userId, emoji },
        },
        create: { messageId, userId, emoji },
        update: {},
      });

      await broadcastReactionChange(io, message, userId, emoji, "add");
    } catch (err) {
      console.error("reaction:add error:", err);
    }
  });

  socket.on("reaction:remove", async (data) => {
    try {
      const { messageId, emoji } = reactionSchema.parse(data);

      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!message) return;

      await prisma.reaction.deleteMany({
        where: { messageId, userId, emoji },
      });

      await broadcastReactionChange(io, message, userId, emoji, "remove");
    } catch (err) {
      console.error("reaction:remove error:", err);
    }
  });
}
