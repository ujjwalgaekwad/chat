import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from "../utils/cookies";
import { ApiError } from "../utils/ApiError";

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body, req.headers["user-agent"]);
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) throw ApiError.unauthorized("No refresh token provided", "NO_REFRESH_TOKEN");

    const result = await authService.refresh(token, req.headers["user-agent"]);
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(token);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, data: { loggedOut: true } });
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.userId!);
    res.status(200).json({ success: true, data: { user } });
  },
};
