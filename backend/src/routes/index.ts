import { Router } from "express";
import { z } from "zod";
import { authController } from "../controllers/auth.controller";
import { workspaceController } from "../controllers/workspace.controller";
import { channelController } from "../controllers/channel.controller";
import { messageController } from "../controllers/message.controller";
import { userController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// Auth routes
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/register", validate(registerSchema), authController.register);
router.post("/auth/login", validate(loginSchema), authController.login);
router.post("/auth/logout", authController.logout);
router.post("/auth/refresh", authController.refresh);

// Workspace routes
const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
});

const inviteSchema = z.object({
  email: z.string().email(),
});

router.post("/workspaces", authMiddleware, validate(createWorkspaceSchema), workspaceController.create);
router.get("/workspaces", authMiddleware, workspaceController.list);
router.get("/workspaces/:id", authMiddleware, workspaceController.getById);
router.post("/workspaces/:id/invite", authMiddleware, validate(inviteSchema), workspaceController.invite);
router.get("/workspaces/:id/members", authMiddleware, workspaceController.getMembers);

// Channel routes
const createChannelSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(250).optional(),
  type: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

const createDMSchema = z.object({
  workspaceId: z.string().uuid(),
  targetUserId: z.string().uuid(),
});

const createGroupDMSchema = z.object({
  workspaceId: z.string().uuid(),
  memberUserIds: z.array(z.string().uuid()).min(2),
  name: z.string().min(1).max(80).optional(),
});

const updateGroupDMSchema = z.object({
  name: z.string().min(1).max(80),
});

const addGroupMemberSchema = z
  .object({
    userId: z.string().uuid().optional(),
    email: z.string().email().optional(),
  })
  .refine((d) => d.userId || d.email, {
    message: "userId or email is required",
  });

router.post("/workspaces/:workspaceId/channels", authMiddleware, validate(createChannelSchema), channelController.create);
router.get("/workspaces/:workspaceId/channels", authMiddleware, channelController.listByWorkspace);
router.get("/channels/:id", authMiddleware, channelController.getById);
router.post("/channels/:id/join", authMiddleware, channelController.join);
router.post("/channels/:id/leave", authMiddleware, channelController.leave);
router.post("/channels/dm", authMiddleware, validate(createDMSchema), channelController.createDM);
router.post("/channels/group-dm", authMiddleware, validate(createGroupDMSchema), channelController.createGroupDM);
router.patch("/channels/:id/group", authMiddleware, validate(updateGroupDMSchema), channelController.updateGroupDM);
router.post("/channels/:id/members", authMiddleware, validate(addGroupMemberSchema), channelController.addGroupMember);
router.delete("/channels/:id/members/:userId", authMiddleware, channelController.removeGroupMember);

// Message routes
const createMessageSchema = z.object({
  content: z.string(),
  type: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"]).optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  parentId: z.string().uuid().optional(),
}).refine((d) => d.content.trim().length > 0 || d.fileUrl, {
  message: "Message content or file is required",
});

const updateMessageSchema = z.object({
  content: z.string().min(1),
});

router.get("/channels/:channelId/messages", authMiddleware, messageController.getByChannel);
router.post("/channels/:channelId/messages", authMiddleware, validate(createMessageSchema), messageController.create);
router.post("/channels/:channelId/messages/upload", authMiddleware, upload.single("file"), messageController.uploadAttachment);
router.get("/messages/:id/replies", authMiddleware, messageController.getThreadReplies);
router.put("/messages/:id", authMiddleware, validate(updateMessageSchema), messageController.update);
router.delete("/messages/:id", authMiddleware, messageController.delete);
router.get("/channels/:channelId/messages/search", authMiddleware, messageController.search);

// User routes
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

router.get("/users/me", authMiddleware, userController.getMe);
router.put("/users/me", authMiddleware, validate(updateProfileSchema), userController.updateProfile);
router.post("/users/avatar", authMiddleware, upload.single("avatar"), userController.uploadAvatar);

export default router;
