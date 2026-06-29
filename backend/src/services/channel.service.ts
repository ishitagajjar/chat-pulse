import { ChannelType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";

async function assertWorkspaceMember(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) {
    throw new AppError(403, "Not a member of this workspace");
  }
  return member;
}

async function getDmPartner(channelId: string, userId: string) {
  const otherMember = await prisma.channelMember.findFirst({
    where: { channelId, userId: { not: userId } },
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });
  return otherMember?.user ?? null;
}

const memberUserSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  email: true,
} as const;

async function getGroupMembers(channelId: string) {
  const members = await prisma.channelMember.findMany({
    where: { channelId },
    include: { user: { select: memberUserSelect } },
    orderBy: { joinedAt: "asc" },
  });
  return members.map((m) => m.user);
}

function buildGroupDisplayName(
  members: { id: string; displayName: string }[],
  currentUserId: string,
  customName?: string | null
): string {
  if (customName?.trim() && !customName.startsWith("group-")) {
    return customName.trim();
  }
  const others = members
    .filter((m) => m.id !== currentUserId)
    .map((m) => m.displayName);
  if (others.length === 0) return "Group";
  if (others.length <= 3) return others.join(", ");
  return `${others.slice(0, 2).join(", ")} +${others.length - 2}`;
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

async function assertGroupChannel(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) {
    throw new AppError(404, "Channel not found");
  }
  if (channel.type !== ChannelType.GROUP_DM) {
    throw new AppError(400, "Not a group conversation");
  }
  await assertChannelMember(channelId, userId);
  return channel;
}

async function findExistingGroupDM(workspaceId: string, userIds: string[]) {
  const sorted = [...new Set(userIds)].sort();
  const groups = await prisma.channel.findMany({
    where: { workspaceId, type: ChannelType.GROUP_DM },
    include: { members: { select: { userId: true } } },
  });

  for (const ch of groups) {
    const memberIds = ch.members.map((m) => m.userId).sort();
    if (
      memberIds.length === sorted.length &&
      memberIds.every((id, i) => id === sorted[i])
    ) {
      return ch;
    }
  }
  return null;
}

async function createGroupSystemMessage(
  channelId: string,
  actorId: string,
  content: string
) {
  await prisma.message.create({
    data: {
      channelId,
      userId: actorId,
      content,
      type: "SYSTEM",
    },
  });
}

export const channelService = {
  async create(
    workspaceId: string,
    userId: string,
    name: string,
    description?: string,
    type: ChannelType = ChannelType.PUBLIC
  ) {
    await assertWorkspaceMember(workspaceId, userId);

    const channel = await prisma.$transaction(async (tx) => {
      const ch = await tx.channel.create({
        data: {
          workspaceId,
          name: name.toLowerCase().replace(/\s+/g, "-"),
          description,
          type,
          createdById: userId,
        },
      });

      await tx.channelMember.create({
        data: { channelId: ch.id, userId },
      });

      return ch;
    });

    return channel;
  },

  async listByWorkspace(workspaceId: string, userId: string) {
    await assertWorkspaceMember(workspaceId, userId);

    const channels = await prisma.channel.findMany({
      where: {
        workspaceId,
        members: { some: { userId } },
      },
      include: {
        createdBy: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        members: {
          where: { userId },
          select: { lastReadAt: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, content: true, createdAt: true, type: true },
        },
        _count: {
          select: {
            messages: {
              where: {
                createdAt: {
                  gt: new Date(0),
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = await Promise.all(
      channels.map(async (ch) => {
        const lastReadAt = ch.members[0]?.lastReadAt ?? new Date(0);
        const unreadCount = await prisma.message.count({
          where: {
            channelId: ch.id,
            createdAt: { gt: lastReadAt },
            userId: { not: userId },
          },
        });

        const dmPartner =
          ch.type === ChannelType.DM
            ? await getDmPartner(ch.id, userId)
            : null;

        const groupMembers =
          ch.type === ChannelType.GROUP_DM
            ? await getGroupMembers(ch.id)
            : null;

        const groupDisplayName =
          groupMembers != null
            ? buildGroupDisplayName(groupMembers, userId, ch.name)
            : null;

        return {
          id: ch.id,
          workspaceId: ch.workspaceId,
          name: ch.name,
          description: ch.description,
          type: ch.type,
          createdById: ch.createdById,
          createdBy: ch.createdBy,
          unreadCount,
          lastMessage: ch.messages[0] ?? null,
          dmPartner,
          groupMembers,
          groupDisplayName,
        };
      })
    );

    return result;
  },

  async getById(channelId: string, userId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        createdBy: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!channel) {
      throw new AppError(404, "Channel not found");
    }

    const isMember = channel.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new AppError(403, "Not a member of this channel");
    }

    const dmPartner =
      channel.type === ChannelType.DM
        ? await getDmPartner(channelId, userId)
        : null;

    const groupMembers =
      channel.type === ChannelType.GROUP_DM
        ? channel.members.map((m) => m.user)
        : null;

    const groupDisplayName =
      groupMembers != null
        ? buildGroupDisplayName(groupMembers, userId, channel.name)
        : null;

    return {
      ...channel,
      dmPartner,
      groupMembers,
      groupDisplayName,
      members: channel.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    };
  },

  async join(channelId: string, userId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) {
      throw new AppError(404, "Channel not found");
    }
    if (channel.type !== ChannelType.PUBLIC) {
      throw new AppError(403, "Cannot join private channel");
    }

    await assertWorkspaceMember(channel.workspaceId, userId);

    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId },
      update: {},
    });

    return channel;
  },

  async leave(channelId: string, userId: string) {
    const member = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!member) {
      throw new AppError(404, "Not a member of this channel");
    }

    await prisma.channelMember.delete({ where: { id: member.id } });
  },

  async createDM(workspaceId: string, userId: string, targetUserId: string) {
    await assertWorkspaceMember(workspaceId, userId);
    await assertWorkspaceMember(workspaceId, targetUserId);

    const userIds = [userId, targetUserId].sort();

    const existingChannels = await prisma.channel.findMany({
      where: { workspaceId, type: ChannelType.DM },
      include: {
        members: { select: { userId: true } },
      },
    });

    for (const ch of existingChannels) {
      const memberIds = ch.members.map((m) => m.userId).sort();
      if (
        memberIds.length === 2 &&
        memberIds[0] === userIds[0] &&
        memberIds[1] === userIds[1]
      ) {
        const dmPartner = await getDmPartner(ch.id, userId);
        return { ...ch, dmPartner };
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new AppError(404, "User not found");
    }

    const channel = await prisma.$transaction(async (tx) => {
      const ch = await tx.channel.create({
        data: {
          workspaceId,
          name: `dm-${userIds.join("-")}`,
          type: ChannelType.DM,
          createdById: userId,
        },
      });

      await tx.channelMember.createMany({
        data: [
          { channelId: ch.id, userId },
          { channelId: ch.id, userId: targetUserId },
        ],
      });

      return ch;
    });

    const dmPartner = await getDmPartner(channel.id, userId);
    return { ...channel, dmPartner };
  },

  async createGroupDM(
    workspaceId: string,
    userId: string,
    memberUserIds: string[],
    name?: string
  ) {
    await assertWorkspaceMember(workspaceId, userId);

    const uniqueIds = [...new Set([userId, ...memberUserIds])];
    if (uniqueIds.length < 3) {
      throw new AppError(
        400,
        "A group needs at least 3 people. For 1-on-1 chat, start a direct message."
      );
    }

    for (const id of uniqueIds) {
      if (id !== userId) {
        await assertWorkspaceMember(workspaceId, id);
      }
    }

    const existing = await findExistingGroupDM(workspaceId, uniqueIds);
    if (existing) {
      const groupMembers = await getGroupMembers(existing.id);
      return {
        ...existing,
        groupMembers,
        groupDisplayName: buildGroupDisplayName(
          groupMembers,
          userId,
          existing.name
        ),
      };
    }

    const channel = await prisma.$transaction(async (tx) => {
      const ch = await tx.channel.create({
        data: {
          workspaceId,
          name: name?.trim() || `group-${Date.now()}`,
          type: ChannelType.GROUP_DM,
          createdById: userId,
        },
      });

      await tx.channelMember.createMany({
        data: uniqueIds.map((id) => ({ channelId: ch.id, userId: id })),
      });

      return ch;
    });

    const groupMembers = await getGroupMembers(channel.id);
    return {
      ...channel,
      groupMembers,
      groupDisplayName: buildGroupDisplayName(
        groupMembers,
        userId,
        channel.name
      ),
    };
  },

  async updateGroupDM(
    channelId: string,
    userId: string,
    data: { name?: string }
  ) {
    const channel = await assertGroupChannel(channelId, userId);

    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: {
        name: data.name?.trim() || channel.name,
      },
    });

    const groupMembers = await getGroupMembers(channelId);
    return {
      ...updated,
      groupMembers,
      groupDisplayName: buildGroupDisplayName(
        groupMembers,
        userId,
        updated.name
      ),
    };
  },

  async addGroupMember(
    channelId: string,
    actorId: string,
    targetUserId: string
  ) {
    const channel = await assertGroupChannel(channelId, actorId);
    await assertWorkspaceMember(channel.workspaceId, targetUserId);

    const existing = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: targetUserId } },
    });
    if (existing) {
      throw new AppError(400, "User is already in this group");
    }

    await prisma.channelMember.create({
      data: { channelId, userId: targetUserId },
    });

    const [actor, target] = await Promise.all([
      prisma.user.findUnique({
        where: { id: actorId },
        select: { displayName: true },
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { displayName: true },
      }),
    ]);

    await createGroupSystemMessage(
      channelId,
      actorId,
      `${actor?.displayName ?? "Someone"} added ${target?.displayName ?? "a member"} to the group`
    );

    const groupMembers = await getGroupMembers(channelId);
    return {
      channelId,
      groupMembers,
      groupDisplayName: buildGroupDisplayName(
        groupMembers,
        actorId,
        channel.name
      ),
    };
  },

  async addGroupMemberByEmail(
    channelId: string,
    actorId: string,
    email: string
  ) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(404, "No account found with this email");
    }
    return this.addGroupMember(channelId, actorId, user.id);
  },

  async removeGroupMember(
    channelId: string,
    actorId: string,
    targetUserId: string
  ) {
    const channel = await assertGroupChannel(channelId, actorId);

    if (targetUserId !== actorId && channel.createdById !== actorId) {
      throw new AppError(403, "Only the group creator can remove other members");
    }

    const member = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: targetUserId } },
    });
    if (!member) {
      throw new AppError(404, "User is not in this group");
    }

    const remaining = await prisma.channelMember.count({
      where: { channelId },
    });
    if (remaining <= 2) {
      throw new AppError(
        400,
        "Cannot remove member — group would have fewer than 2 people. Leave the group instead."
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { displayName: true },
    });

    await prisma.channelMember.delete({ where: { id: member.id } });

    if (targetUserId === actorId) {
      await createGroupSystemMessage(
        channelId,
        actorId,
        `${target?.displayName ?? "A member"} left the group`
      );
      return { channelId, left: true };
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { displayName: true },
    });

    await createGroupSystemMessage(
      channelId,
      actorId,
      `${actor?.displayName ?? "Someone"} removed ${target?.displayName ?? "a member"} from the group`
    );

    const groupMembers = await getGroupMembers(channelId);
    return {
      channelId,
      left: false,
      groupMembers,
      groupDisplayName: buildGroupDisplayName(
        groupMembers,
        actorId,
        channel.name
      ),
    };
  },
};
