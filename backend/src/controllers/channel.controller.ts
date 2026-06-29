import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { channelService } from "../services/channel.service";
import { ApiResponse } from "../utils/apiResponse";
import { getParam } from "../utils/params";

export const channelController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channel = await channelService.create(
        getParam(req, "workspaceId"),
        req.userId!,
        req.body.name,
        req.body.description,
        req.body.type
      );
      res.status(201).json(ApiResponse.success(channel, "Channel created"));
    } catch (err) {
      next(err);
    }
  },

  async listByWorkspace(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channels = await channelService.listByWorkspace(
        getParam(req, "workspaceId"),
        req.userId!
      );
      res.json(ApiResponse.success(channels));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channel = await channelService.getById(getParam(req, "id"), req.userId!);
      res.json(ApiResponse.success(channel));
    } catch (err) {
      next(err);
    }
  },

  async join(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channel = await channelService.join(getParam(req, "id"), req.userId!);
      res.json(ApiResponse.success(channel, "Joined channel"));
    } catch (err) {
      next(err);
    }
  },

  async leave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await channelService.leave(getParam(req, "id"), req.userId!);
      res.json(ApiResponse.success(null, "Left channel"));
    } catch (err) {
      next(err);
    }
  },

  async createDM(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channel = await channelService.createDM(
        req.body.workspaceId,
        req.userId!,
        req.body.targetUserId
      );
      res.status(201).json(ApiResponse.success(channel, "DM created"));
    } catch (err) {
      next(err);
    }
  },

  async createGroupDM(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channel = await channelService.createGroupDM(
        req.body.workspaceId,
        req.userId!,
        req.body.memberUserIds,
        req.body.name
      );
      res.status(201).json(ApiResponse.success(channel, "Group created"));
    } catch (err) {
      next(err);
    }
  },

  async updateGroupDM(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channel = await channelService.updateGroupDM(
        getParam(req, "id"),
        req.userId!,
        { name: req.body.name }
      );
      res.json(ApiResponse.success(channel, "Group updated"));
    } catch (err) {
      next(err);
    }
  },

  async addGroupMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channelId = getParam(req, "id");
      let result;
      if (req.body.email) {
        result = await channelService.addGroupMemberByEmail(
          channelId,
          req.userId!,
          req.body.email
        );
      } else if (req.body.userId) {
        result = await channelService.addGroupMember(
          channelId,
          req.userId!,
          req.body.userId
        );
      } else {
        res.status(400).json(ApiResponse.error("userId or email is required"));
        return;
      }
      res.json(ApiResponse.success(result, "Member added"));
    } catch (err) {
      next(err);
    }
  },

  async removeGroupMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await channelService.removeGroupMember(
        getParam(req, "id"),
        req.userId!,
        getParam(req, "userId")
      );
      res.json(ApiResponse.success(result, "Member removed"));
    } catch (err) {
      next(err);
    }
  },
};
