import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { messageService } from "../services/message.service";
import { ApiResponse } from "../utils/apiResponse";
import { getParam } from "../utils/params";

export const messageController = {
  async getByChannel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const before = req.query.before as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const messages = await messageService.getByChannel(
        getParam(req, "channelId"),
        req.userId!,
        before,
        limit
      );
      res.json(ApiResponse.success(messages));
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const message = await messageService.create(
        getParam(req, "channelId"),
        req.userId!,
        req.body.content,
        req.body.type,
        req.body.fileUrl,
        req.body.fileName,
        req.body.fileSize,
        req.body.parentId
      );
      res.status(201).json(ApiResponse.success(message, "Message created"));
    } catch (err) {
      next(err);
    }
  },

  async getThreadReplies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await messageService.getThreadReplies(
        getParam(req, "id"),
        req.userId!
      );
      res.json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  },

  async uploadAttachment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json(ApiResponse.error("No file uploaded"));
        return;
      }
      const result = await messageService.uploadAttachment(
        getParam(req, "channelId"),
        req.userId!,
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
      res.json(ApiResponse.success(result, "File uploaded"));
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const message = await messageService.update(
        getParam(req, "id"),
        req.userId!,
        req.body.content
      );
      res.json(ApiResponse.success(message, "Message updated"));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const message = await messageService.delete(getParam(req, "id"), req.userId!);
      res.json(ApiResponse.success(message, "Message deleted"));
    } catch (err) {
      next(err);
    }
  },

  async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      if (!q) {
        res.status(400).json(ApiResponse.error("Search query required"));
        return;
      }
      const messages = await messageService.search(
        getParam(req, "channelId"),
        req.userId!,
        q
      );
      res.json(ApiResponse.success(messages));
    } catch (err) {
      next(err);
    }
  },
};
