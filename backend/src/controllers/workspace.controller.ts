import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { workspaceService } from "../services/workspace.service";
import { ApiResponse } from "../utils/apiResponse";
import { getParam } from "../utils/params";

export const workspaceController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspace = await workspaceService.create(
        req.userId!,
        req.body.name
      );
      res.status(201).json(ApiResponse.success(workspace, "Workspace created"));
    } catch (err) {
      next(err);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaces = await workspaceService.listForUser(req.userId!);
      res.json(ApiResponse.success(workspaces));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspace = await workspaceService.getById(
        getParam(req, "id"),
        req.userId!
      );
      res.json(ApiResponse.success(workspace));
    } catch (err) {
      next(err);
    }
  },

  async invite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const member = await workspaceService.invite(
        getParam(req, "id"),
        req.userId!,
        req.body.email
      );
      res.status(201).json(ApiResponse.success(member, "Member invited"));
    } catch (err) {
      next(err);
    }
  },

  async getMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const members = await workspaceService.getMembers(
        getParam(req, "id"),
        req.userId!
      );
      res.json(ApiResponse.success(members));
    } catch (err) {
      next(err);
    }
  },
};
