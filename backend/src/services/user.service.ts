import { prisma } from "../lib/prisma";
import { uploadFile } from "../lib/cloudinary";
import { AppError } from "../middlewares/errorHandler";

export const userService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new AppError(404, "User not found");
    }
    return user;
  },

  async updateProfile(
    userId: string,
    data: { displayName?: string; avatarUrl?: string }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
  },

  async uploadAvatar(userId: string, fileBuffer: Buffer, _mimeType: string) {
    const result = await uploadFile(
      fileBuffer,
      "avatar.jpg",
      "chatpulse/avatars",
      "image"
    );
    return this.updateProfile(userId, { avatarUrl: result.secure_url });
  },
};
