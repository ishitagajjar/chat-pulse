import { WorkspaceRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { presenceService } from "./presence.service";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const workspaceService = {
  async create(userId: string, name: string) {
    let slug = slugify(name);
    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: { name, slug, ownerId: userId },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
      });

      const generalChannel = await tx.channel.create({
        data: {
          workspaceId: ws.id,
          name: "general",
          description: "General discussion",
          createdById: userId,
        },
      });

      await tx.channelMember.create({
        data: { channelId: generalChannel.id, userId },
      });

      return ws;
    });

    return workspace;
  },

  async listForUser(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      memberCount: m.workspace._count.members,
    }));
  },

  async getById(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      throw new AppError(403, "Not a member of this workspace");
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { _count: { select: { members: true } } },
    });

    if (!workspace) {
      throw new AppError(404, "Workspace not found");
    }

    return { ...workspace, memberCount: workspace._count.members };
  },

  async invite(workspaceId: string, inviterId: string, email: string) {
    const inviter = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: inviterId } },
    });
    if (!inviter || !["OWNER", "ADMIN"].includes(inviter.role)) {
      throw new AppError(403, "Only admins can invite members");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (existing) {
      throw new AppError(409, "User is already a member");
    }

    const member = await prisma.workspaceMember.create({
      data: { workspaceId, userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });

    const publicChannels = await prisma.channel.findMany({
      where: { workspaceId, type: "PUBLIC" },
    });

    for (const channel of publicChannels) {
      await prisma.channelMember.upsert({
        where: {
          channelId_userId: { channelId: channel.id, userId: user.id },
        },
        create: { channelId: channel.id, userId: user.id },
        update: {},
      });
    }

    return member;
  },

  async getMembers(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      throw new AppError(403, "Not a member of this workspace");
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            status: true,
            lastSeenAt: true,
          },
        },
      },
    });

    return Promise.all(
      members.map(async (m) => {
        const liveStatus = await presenceService.getStatus(m.user.id);
        const status =
          liveStatus === "online"
            ? "ONLINE"
            : liveStatus === "away"
              ? "AWAY"
              : "OFFLINE";

        return {
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt,
          user: { ...m.user, status },
        };
      })
    );
  },
};
