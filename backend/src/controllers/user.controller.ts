import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { userService } from "../services/user.service";
import { ApiResponse } from "../utils/apiResponse";

export const userController = {
  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getMe(req.userId!);
      res.json(ApiResponse.success(user));
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateProfile(req.userId!, req.body);
      res.json(ApiResponse.success(user, "Profile updated"));
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json(ApiResponse.error("No file uploaded"));
        return;
      }
      const user = await userService.uploadAvatar(
        req.userId!,
        req.file.buffer,
        req.file.mimetype
      );
      res.json(ApiResponse.success(user, "Avatar uploaded"));
    } catch (err) {
      next(err);
    }
  },
};
