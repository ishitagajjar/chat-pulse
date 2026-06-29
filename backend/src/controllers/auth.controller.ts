import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../utils/apiResponse";
import { config } from "../config";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, displayName } = req.body;
      const result = await authService.register(email, password, displayName);
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.status(201).json(
        ApiResponse.success(
          { accessToken: result.accessToken, user: result.user },
          "Registration successful"
        )
      );
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json(
        ApiResponse.success(
          { accessToken: result.accessToken, user: result.user },
          "Login successful"
        )
      );
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (token) {
        await authService.logout(token);
      }
      res.clearCookie("refreshToken", { path: "/api/auth" });
      res.json(ApiResponse.success(null, "Logged out"));
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        res.status(401).json(ApiResponse.error("No refresh token"));
        return;
      }
      const result = await authService.refresh(token);
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json(
        ApiResponse.success(
          { accessToken: result.accessToken },
          "Token refreshed"
        )
      );
    } catch (err) {
      next(err);
    }
  },
};
